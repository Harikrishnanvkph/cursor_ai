"use client"

import { useChartStore } from "@/lib/chart-store"
import type { TemplateLayout } from "@/lib/template-store"
import { generateChartHTMLForTemplate, type HTMLExportOptions } from "@/lib/html-exporter"
import type { TemplateExportOptions } from "./template-export-types"
import { hexToRgba, getBackgroundSize } from "./canvas-utils"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { generateDecorationsSVG, generateDecorationsCSS } from "./decoration-html-export"
import { getPatternCSS } from "@/lib/utils"

export const exportTemplateAsHTML = async (
    template: TemplateLayout,
    chartData: any,
    chartConfig: any,
    options: TemplateExportOptions
): Promise<string> => {
    const { fileName = 'chart-template', htmlOptions = {} } = options

    // Use the existing chart HTML export logic as the base
    const baseHtmlOptions: HTMLExportOptions = {
        title: template.name,
        width: template.chartArea.width,
        height: template.chartArea.height,
        backgroundColor: template.backgroundColor,
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: true,
        fileName: `${fileName}.html`,
        template: "standard", // Use standard template as base
        ...htmlOptions
    }

    // Generate the chart components using the new template-specific function
    const chartComponents = await generateChartHTMLForTemplate(baseHtmlOptions)

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

        if (bg.type === 'image' && bg.imageUrl) {
            const size = getBackgroundSize(bg.imageFit)
            const blur = bg.blur ? `filter: blur(${bg.blur}px);` : ''
            if (opacity < 1) {
                return `
          background: linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${bg.imageUrl});
          background-size: ${size};
          background-position: center;
          background-repeat: no-repeat;
          ${blur}
        `
            } else {
                return `
          background: url(${bg.imageUrl});
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

    // Create template-specific HTML structure
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
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
        }
        
        .template-container {
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            ${getTemplateBackgroundCSS()}
            border: ${template.borderWidth}px solid ${template.borderColor};
            margin: 0 auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .chart-area {
            position: absolute;
            left: ${template.chartArea.x}px;
            top: ${template.chartArea.y}px;
            width: ${template.chartArea.width}px;
            height: ${template.chartArea.height}px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        ${chartComponents.chartStyles}
        
        .text-area {
            position: absolute;
            overflow: hidden;
            word-wrap: break-word;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 4px;
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
            margin: 8px 0;
        }
        
        .text-area.html-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h4 {
            font-size: 1em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        /* Paragraph and other text styles */
        .text-area.html-content p {
            margin: 0.5em 0;
        }
        
        /* Remove top margin from first element, bottom margin from last element */
        .text-area.html-content > h1:first-child,
        .text-area.html-content > h2:first-child,
        .text-area.html-content > h3:first-child,
        .text-area.html-content > h4:first-child,
        .text-area.html-content > h5:first-child,
        .text-area.html-content > h6:first-child,
        .text-area.html-content > p:first-child {
            margin-top: 0;
        }
        
        .text-area.html-content > h1:last-child,
        .text-area.html-content > h2:last-child,
        .text-area.html-content > h3:last-child,
        .text-area.html-content > h4:last-child,
        .text-area.html-content > h5:last-child,
        .text-area.html-content > h6:last-child,
        .text-area.html-content > p:last-child {
            margin-bottom: 0;
        }
        
        .text-area:hover {
            background-color: rgba(0, 0, 0, 0.02);
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
        
        @media (max-width: 768px) {
            .template-container {
                width: 100%;
                max-width: ${template.width}px;
                height: auto;
                min-height: ${template.height}px;
            }
            
            .chart-area {
                position: relative;
                left: 0;
                top: 0;
                width: 100%;
                height: 400px;
                margin: 20px 0;
            }
            
            .text-area {
                position: relative;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="template-container">
        <div class="chart-area">
            ${chartComponents.chartContainer}
        </div>
        ${template.textAreas
            .filter(ta => ta.visible)
            .map(textArea => {
                const isHTML = textArea.contentType === 'html'
                const contentClass = isHTML ? 'html-content' : 'text-content'
                const backgroundCSS = getTextAreaBackgroundCSS(textArea)
                return `
            <div class="text-area ${contentClass}" style="
                left: ${textArea.position.x}px;
                top: ${textArea.position.y}px;
                width: ${textArea.position.width}px;
                height: ${textArea.position.height}px;
                font-size: ${textArea.style.fontSize}px;
                font-family: ${textArea.style.fontFamily};
                font-weight: ${textArea.style.fontWeight};
                color: ${textArea.style.color};
                text-align: ${textArea.style.textAlign};
                line-height: ${textArea.style.lineHeight};
                letter-spacing: ${textArea.style.letterSpacing}px;
                ${backgroundCSS}
            ">${textArea.content}</div>
          `}).join('')}
        ${generateDecorationsSVG(useDecorationStore.getState().shapes, template.width, template.height)}
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
    const { fileName = 'chart-template', htmlOptions = {} } = options

    try {
        // Get current chart data from the store
        const { chartType, chartData, chartConfig } = useChartStore.getState()

        // Use the existing chart HTML export logic as the base
        const baseHtmlOptions: HTMLExportOptions = {
            title: template.name,
            width: template.chartArea.width,
            height: template.chartArea.height,
            backgroundColor: template.backgroundColor,
            includeResponsive: true,
            includeAnimations: true,
            includeTooltips: true,
            includeLegend: true,
            fileName: `${fileName}.html`,
            template: "standard", // Use standard template as base
            ...htmlOptions
        }

        // Generate the chart components using the unified export system
        const chartComponents = await generateChartHTMLForTemplate(baseHtmlOptions)

        // Generate template background styling
        const getBackgroundStyles = (): string => {
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

            if (bg.type === 'image' && bg.imageUrl) {
                const size = getBackgroundSize(bg.imageFit)
                const blur = bg.blur ? `filter: blur(${bg.blur}px);` : ''
                if (opacity < 1) {
                    return `
            background: linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${bg.imageUrl});
            background-size: ${size};
            background-position: center;
            background-repeat: no-repeat;
            ${blur}
          `
                } else {
                    return `
            background: url(${bg.imageUrl});
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

        // Create template-specific HTML structure
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
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
        }
        
        .template-container {
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            /* background handled by child div */
            border: ${template.borderWidth}px solid ${template.borderColor};
            margin: 0 auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .template-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        }
        
        .chart-area {
            position: absolute;
            left: ${template.chartArea.x}px;
            top: ${template.chartArea.y}px;
            width: ${template.chartArea.width}px;
            height: ${template.chartArea.height}px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            z-index: 1;
        }
        
        ${chartComponents.chartStyles}
        
        .text-area {
            position: absolute;
            overflow: hidden;
            word-wrap: break-word;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 4px;
            z-index: 2;
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
            margin: 8px 0;
        }
        
        .text-area.html-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h4 {
            font-size: 1em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h5 {
            font-size: 0.83em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .text-area.html-content h6 {
            font-size: 0.67em;
            font-weight: bold;
            margin: 8px 0;
        }
        
        /* Paragraph and other text styles */
        .text-area.html-content p {
            margin: 0.5em 0;
        }
        
        /* Remove top margin from first element, bottom margin from last element */
        .text-area.html-content > h1:first-child,
        .text-area.html-content > h2:first-child,
        .text-area.html-content > h3:first-child,
        .text-area.html-content > h4:first-child,
        .text-area.html-content > h5:first-child,
        .text-area.html-content > h6:first-child,
        .text-area.html-content > p:first-child {
            margin-top: 0;
        }
        
        .text-area.html-content > h1:last-child,
        .text-area.html-content > h2:last-child,
        .text-area.html-content > h3:last-child,
        .text-area.html-content > h4:last-child,
        .text-area.html-content > h5:last-child,
        .text-area.html-content > h6:last-child,
        .text-area.html-content > p:last-child {
            margin-bottom: 0;
        }
        
        .text-area:hover {
            background-color: rgba(0, 0, 0, 0.02);
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
        
        @media (max-width: 768px) {
            .template-container {
                width: 100%;
                max-width: ${template.width}px;
                height: auto;
                min-height: ${template.height}px;
            }
            
            .chart-area {
                position: relative;
                left: 0;
                top: 0;
                width: 100%;
                height: 400px;
                margin: 20px 0;
            }
            
            .text-area {
                position: relative;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="template-container">
        <div class="template-background" style="${getBackgroundStyles()}"></div>
        <div class="chart-area">
            ${chartComponents.chartContainer}
        </div>
        ${template.textAreas
                .filter(ta => ta.visible)
                .map(textArea => {
                    const isHTML = textArea.contentType === 'html'
                    const contentClass = isHTML ? 'html-content' : 'text-content'
                    const backgroundCSS = getTextAreaBackgroundCSS(textArea)
                    return `
            <div class="text-area ${contentClass}" style="
                left: ${textArea.position.x}px;
                top: ${textArea.position.y}px;
                width: ${textArea.position.width}px;
                height: ${textArea.position.height}px;
                font-size: ${textArea.style.fontSize}px;
                font-family: ${textArea.style.fontFamily};
                font-weight: ${textArea.style.fontWeight};
                color: ${textArea.style.color};
                text-align: ${textArea.style.textAlign};
                line-height: ${textArea.style.lineHeight};
                letter-spacing: ${textArea.style.letterSpacing}px;
                ${backgroundCSS}
            ">${textArea.content}</div>
          `}).join('')}
        ${generateDecorationsSVG(useDecorationStore.getState().shapes, template.width, template.height)}
    </div>

    <script>
        ${chartComponents.chartScript}
    </script>
</body>
</html>`

        return html
    } catch (error) {
        console.error('Error generating unified template HTML:', error)
        throw new Error(`Failed to generate template HTML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}
