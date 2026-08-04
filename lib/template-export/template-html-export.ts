"use client"

import { useChartStore } from "@/lib/chart-store"
import type { TemplateLayout } from "@/lib/template-store"
import { generateChartHTMLForTemplate, type HTMLExportOptions } from "@/lib/html-exporter"
import type { TemplateExportOptions } from "./template-export-types"
import { hexToRgba, getBackgroundSize } from "./canvas-utils"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { generateDecorationsSVGAsync, generateDecorationsCSS } from "./decoration-html-export"
import { getPatternCSS } from "@/lib/utils"
import { fetchImageAsBase64, embedImagesInHtmlString, generateGoogleFontLinks } from "@/lib/utils/html-export-utils"

export const exportTemplateAsHTML = async (
    template: TemplateLayout,
    chartData: any,
    chartConfig: any,
    options: TemplateExportOptions
): Promise<string> => {
    const { fileName = 'chart-template', htmlOptions = {} } = options

    // Resolve per-chart config (same logic as use-chart-state hooks)
    const storeState = useChartStore.getState()
    let resolvedConfig = chartConfig
    if (storeState.chartMode === 'single') {
        const ds = storeState.chartData?.datasets?.[storeState.activeDatasetIndex]
        resolvedConfig = (ds as any)?.chartConfig ?? chartConfig
    } else {
        const group = (storeState as any).groups?.find((g: any) => g.id === storeState.activeGroupId)
        resolvedConfig = group?.chartConfig ?? chartConfig
    }
    const visualSettings = (resolvedConfig as any)?.visualSettings ?? {}

    // Use the existing chart HTML export logic as the base
    const baseHtmlOptions: HTMLExportOptions = {
        title: template.name,
        width: template.chartArea.width,
        height: template.chartArea.height,
        backgroundColor: template.backgroundColor,
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: resolvedConfig?.plugins?.legend?.display ?? true,
        fillArea: visualSettings.fillArea,
        showBorder: visualSettings.showBorder,
        showImages: visualSettings.showImages ?? true,
        showLabels: visualSettings.showLabels ?? true,
        fileName: `${fileName}.html`,
        template: "standard", // Use standard template as base
        ...htmlOptions
    }

    // Generate the chart components using the new template-specific function
    const chartComponents = await generateChartHTMLForTemplate(baseHtmlOptions)

    // Process template background image to Base64 data URI for offline support
    let templateBgImageUrl = template.background?.imageUrl
    if (templateBgImageUrl && !templateBgImageUrl.startsWith('data:image/')) {
        try {
            templateBgImageUrl = await fetchImageAsBase64(templateBgImageUrl)
        } catch (e) {
            console.warn('Failed to convert template background image to Base64:', e)
        }
    }

    // Generate template background CSS
    const getTemplateBackgroundCSS = (): string => {
        const bg = template.background
        if (!bg || bg.type === 'transparent') {
            return `background-color: ${template.backgroundColor};`
        }

        const opacity = (bg.opacity ?? 100) / 100

        if (bg.type === 'color') {
            return `background-color: ${hexToRgba(bg.color || '#ffffff', opacity)};`
        }

        if (bg.type === 'pattern') {
            const patternColor = bg.patternColor || '#e2e8f0'
            const patternType = bg.patternType || 'dots'
            const rgbaColor = hexToRgba(patternColor, opacity)
            const { styleString } = getPatternCSS(patternType, rgbaColor, 1)
            return `${styleString}`
        }

        if (bg.type === 'gradient') {
            const color1 = bg.gradientColor1 || '#ffffff'
            const color2 = bg.gradientColor2 || '#000000'
            const gradientType = bg.gradientType || 'linear'
            const direction = bg.gradientDirection || 'to right'

            const rgbaColor1 = hexToRgba(color1, opacity)
            const rgbaColor2 = hexToRgba(color2, opacity)

            if (gradientType === 'radial') {
                return `background: radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2});`
            } else {
                return `background: linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2});`
            }
        }

        if (bg.type === 'image' && templateBgImageUrl) {
            const size = getBackgroundSize(bg.imageFit)
            const blur = bg.blur ? `filter: blur(${bg.blur}px);` : ''
            if (opacity < 1) {
                return `
          background: linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${templateBgImageUrl});
          background-size: ${size};
          background-position: center;
          background-repeat: no-repeat;
          ${blur}
        `
            } else {
                return `
          background: url(${templateBgImageUrl});
          background-size: ${size};
          background-position: center;
          background-repeat: no-repeat;
          ${blur}
        `
            }
        }

        return `background-color: ${template.backgroundColor};`
    }


    // Generate text area background CSS
    const getTextAreaBackgroundCSS = (textArea: any): string => {
        const bg = textArea.background
        if (!bg || bg.type === 'transparent') {
            return ''
        }

        const opacity = (bg.opacity ?? 100) / 100

        if (bg.type === 'color') {
            return `background-color: ${hexToRgba(bg.color || '#ffffff', opacity)};`
        }

        if (bg.type === 'pattern') {
            const patternColor = bg.patternColor || '#e2e8f0'
            const patternType = bg.patternType || 'dots'
            const rgbaColor = hexToRgba(patternColor, opacity)
            const { styleString } = getPatternCSS(patternType, rgbaColor, 1)
            return `${styleString}`
        }

        if (bg.type === 'gradient') {
            const color1 = bg.gradientColor1 || '#ffffff'
            const color2 = bg.gradientColor2 || '#000000'
            const gradientType = bg.gradientType || 'linear'
            const direction = bg.gradientDirection || 'to right'

            const rgbaColor1 = hexToRgba(color1, opacity)
            const rgbaColor2 = hexToRgba(color2, opacity)

            if (gradientType === 'radial') {
                return `background: radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2});`
            } else {
                return `background: linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2});`
            }
        }

        if (bg.type === 'image' && bg.imageUrl) {
            const size = getBackgroundSize(bg.imageFit)
            if (opacity < 1) {
                return `
          background: linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${bg.imageUrl});
          background-size: ${size};
          background-position: center;
          background-repeat: no-repeat;
        `
            } else {
                return `
          background: url(${bg.imageUrl});
          background-size: ${size};
          background-position: center;
          background-repeat: no-repeat;
        `
            }
        }

        return ''
    }

    // Collect all font families used across text areas for Google Fonts injection
    const fontFamilies = template.textAreas.map(ta => ta.style?.fontFamily)
    const googleFontLinks = generateGoogleFontLinks(fontFamilies)

    // Render decoration shapes asynchronously (with base64 embedded shape images)
    const decorationsSVG = await generateDecorationsSVGAsync(
        useDecorationStore.getState().shapes,
        template.width,
        template.height
    )

    // Asynchronously process text areas (embedded base64 images and full CSS properties)
    const processedTextAreas = await Promise.all(
        template.textAreas
            .filter(ta => ta.visible)
            .map(async textArea => {
                const isHTML = textArea.contentType === 'html' || /<[a-z][\s\S]*>/i.test(textArea.content || '')
                const contentClass = isHTML ? 'html-content' : 'text-content'
                const backgroundCSS = getTextAreaBackgroundCSS(textArea)

                // Convert inline images in text area content to base64
                let processedContent = textArea.content || ''
                if (isHTML && processedContent.includes('<img')) {
                    processedContent = await embedImagesInHtmlString(processedContent)
                }

                // Support rotation, opacity, border, border-radius, box-shadow, padding, font-style
                const pos = textArea.position as any
                const style = textArea.style as any
                const transform = pos.rotation ? `transform: rotate(${pos.rotation}deg);` : ''
                const opacity = style.opacity !== undefined ? `opacity: ${style.opacity};` : ''
                const border = style.border ? `border: ${style.border};` : ''
                const borderRadius = style.borderRadius !== undefined ? `border-radius: ${style.borderRadius}px;` : ''
                const boxShadow = style.boxShadow ? `box-shadow: ${style.boxShadow};` : ''
                const padding = style.padding !== undefined ? `padding: ${style.padding}px;` : 'padding: 8px;'
                const fontStyle = style.fontStyle ? `font-style: ${style.fontStyle};` : ''
                const zIndex = (textArea as any).zIndex !== undefined ? (textArea as any).zIndex : 30

                return `
                <div class="text-area ${contentClass}" style="
                    left: ${textArea.position.x}px;
                    top: ${textArea.position.y}px;
                    width: ${textArea.position.width}px;
                    height: ${textArea.position.height}px;
                    font-size: ${textArea.style.fontSize}px;
                    font-family: ${textArea.style.fontFamily || 'sans-serif'};
                    font-weight: ${textArea.style.fontWeight || 'normal'};
                    color: ${textArea.style.color || '#000'};
                    text-align: ${textArea.style.textAlign || 'left'};
                    line-height: ${textArea.style.lineHeight || 1.4};
                    letter-spacing: ${textArea.style.letterSpacing || 0}px;
                    z-index: ${zIndex};
                    ${transform}
                    ${opacity}
                    ${border}
                    ${borderRadius}
                    ${boxShadow}
                    ${padding}
                    ${fontStyle}
                    ${backgroundCSS}
                ">${processedContent}</div>
              `
            })
    )

    // Create template-specific HTML structure
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    ${googleFontLinks}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${chartComponents.pluginsScript}
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        ${generateDecorationsCSS()}
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .template-scaler {
            width: 100%;
            max-width: ${template.width}px;
            display: flex;
            justify-content: center;
        }
        
        .template-container {
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            ${getTemplateBackgroundCSS()}
            border: ${template.borderWidth}px solid ${template.borderColor};
            margin: 0 auto;
            border-radius: 0px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform-origin: top center;
        }
        
        ${chartComponents.chartStyles}

        .chart-area {
            position: absolute !important;
            left: ${template.chartArea.x}px !important;
            top: ${template.chartArea.y}px !important;
            width: ${template.chartArea.width}px !important;
            height: ${template.chartArea.height}px !important;
            background: transparent;
            border-radius: 0px;
            overflow: hidden;
            z-index: 10;
        }

        .chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .text-area {
            position: absolute;
            overflow: hidden;
            word-wrap: break-word;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 0px;
            z-index: 30;
        }
        
        .text-area.text-content {
            white-space: pre-wrap;
        }
        
        .text-area.html-content {
            white-space: normal;
            overflow: auto;
        }
        
        /* List styles for HTML content */
        .text-area.html-content ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 0.5em 0;
        }
        
        .text-area.html-content ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 0.5em 0;
        }
        
        .text-area.html-content li {
            margin: 0.25em 0;
        }
        
        .text-area.html-content ul ul {
            list-style-type: circle;
        }
        
        .text-area.html-content ul ul ul {
            list-style-type: square;
        }
        
        .text-area.html-content ol ol {
            list-style-type: lower-alpha;
        }
        
        .text-area.html-content ol ol ol {
            list-style-type: lower-roman;
        }
        
        /* Heading styles for HTML content */
        .text-area.html-content h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h4 {
            font-size: 1em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        /* Paragraph and other text styles */
        .text-area.html-content p {
            margin: 0.5em 0;
        }

        .text-area.html-content mark {
            background-color: #fef08a;
            padding: 0.1em 0.2em;
            border-radius: 0.2em;
        }

        .text-area.html-content u {
            text-decoration: underline;
        }

        .text-area.html-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0.5em 0;
        }

        .text-area.html-content blockquote {
            border-left: 3px solid #cbd5e1;
            padding-left: 1em;
            margin: 0.5em 0;
            color: #64748b;
        }

        .text-area.html-content code {
            background-color: #f1f5f9;
            padding: 0.2em 0.4em;
            border-radius: 0.25em;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        /* Remove top margin from first element, bottom margin from last element */
        .text-area.html-content > h1:first-child,
        .text-area.html-content > h2:first-child,
        .text-area.html-content > h3:first-child,
        .text-area.html-content > h4:first-child,
        .text-area.html-content > h5:first-child,
        .text-area.html-content > h6:first-child,
        .text-area.html-content > p:first-child,
        .text-area.html-content > ul:first-child,
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        ${generateDecorationsCSS()}
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .template-scaler {
            width: 100%;
            max-width: ${template.width}px;
            display: flex;
            justify-content: center;
        }
        
        .template-container {
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            ${getTemplateBackgroundCSS()}
            border: ${template.borderWidth}px solid ${template.borderColor};
            margin: 0 auto;
            border-radius: 0px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform-origin: top center;
        }
        
        ${chartComponents.chartStyles}

        .chart-area {
            position: absolute !important;
            left: ${template.chartArea.x}px !important;
            top: ${template.chartArea.y}px !important;
            width: ${template.chartArea.width}px !important;
            height: ${template.chartArea.height}px !important;
            background: transparent;
            border-radius: 0px;
            overflow: hidden;
            z-index: 10;
        }

        .chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .text-area {
            position: absolute;
            overflow: hidden;
            word-wrap: break-word;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 0px;
            z-index: 30;
        }
        
        .text-area.text-content {
            white-space: pre-wrap;
        }
        
        .text-area.html-content {
            white-space: normal;
            overflow: auto;
        }
        
        /* List styles for HTML content */
        .text-area.html-content ul {
            list-style-type: disc;
            padding-left: 1.5em;
            margin: 0.5em 0;
        }
        
        .text-area.html-content ol {
            list-style-type: decimal;
            padding-left: 1.5em;
            margin: 0.5em 0;
        }
        
        .text-area.html-content li {
            margin: 0.25em 0;
        }
        
        .text-area.html-content ul ul {
            list-style-type: circle;
        }
        
        .text-area.html-content ul ul ul {
            list-style-type: square;
        }
        
        .text-area.html-content ol ol {
            list-style-type: lower-alpha;
        }
        
        .text-area.html-content ol ol ol {
            list-style-type: lower-roman;
        }
        
        /* Heading styles for HTML content */
        .text-area.html-content h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h4 {
            font-size: 1em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        .text-area.html-content h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin: 0.5em 0;
        }
        
        /* Paragraph and other text styles */
        .text-area.html-content p {
            margin: 0.5em 0;
        }

        .text-area.html-content mark {
            background-color: #fef08a;
            padding: 0.1em 0.2em;
            border-radius: 0.2em;
        }

        .text-area.html-content u {
            text-decoration: underline;
        }

        .text-area.html-content img {
            max-width: 100%;
            height: auto;
            display: inline-block;
            vertical-align: middle;
            object-fit: fill;
        }

        .text-area.html-content blockquote {
            border-left: 3px solid #cbd5e1;
            padding-left: 1em;
            margin: 0.5em 0;
            color: #64748b;
        }

        .text-area.html-content code {
            background-color: #f1f5f9;
            padding: 0.2em 0.4em;
            border-radius: 0.25em;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        /* Remove top margin from first element, bottom margin from last element */
        .text-area.html-content > h1:first-child,
        .text-area.html-content > h2:first-child,
        .text-area.html-content > h3:first-child,
        .text-area.html-content > h4:first-child,
        .text-area.html-content > h5:first-child,
        .text-area.html-content > h6:first-child,
        .text-area.html-content > p:first-child,
        .text-area.html-content > ul:first-child,
        .text-area.html-content > ol:first-child,
        .text-area.html-content > blockquote:first-child {
            margin-top: 0 !important;
        }
        
        .text-area.html-content > ul:last-child,
        .text-area.html-content > ol:last-child,
        .text-area.html-content > blockquote:last-child {
            margin-bottom: 0 !important;
        }
        
        @media print {
            body {
                padding: 0;
                background-color: white;
            }
            .template-container {
                width: 100%;
                height: auto;
                max-width: none;
                border-radius: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="template-container" style="${getTemplateBackgroundCSS()}">
        <div class="chart-area" style="position: absolute; left: ${template.chartArea.x}px; top: ${template.chartArea.y}px; width: ${template.chartArea.width}px; height: ${template.chartArea.height}px; z-index: 10;">
            ${chartComponents.chartContainer}
        </div>
        ${processedTextAreas.join('')}
        ${decorationsSVG}
    </div>

    <script>
        ${chartComponents.chartScript}
    </script>
</body>
</html>`

    return html
}

/**
 * Unified template HTML export function that uses the existing chart export infrastructure
 * This ensures templates use the same robust chart export logic as regular charts
 */
export const exportTemplateAsUnifiedHTML = async (
    template: TemplateLayout,
    options: TemplateExportOptions = {}
): Promise<string> => {
    const storeState = useChartStore.getState()
    const { chartData, chartConfig } = storeState
    return exportTemplateAsHTML(template, chartData, chartConfig, options)
}
