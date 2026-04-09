"use client"

import type { RenderedFormat, RenderedZone, TextZone, StatZone, BackgroundZone, DecorationZone, ChartZone } from "@/lib/format-types"
import type { DecorationShape } from "@/lib/stores/decoration-store"
import { generateChartHTMLForTemplate, type HTMLExportOptions } from "@/lib/html-exporter"
import { generateDecorationsSVG, generateDecorationsCSS } from "./decoration-html-export"
import { getPatternCSS } from "@/lib/utils"

// ═══════════════════════════════════════════════════════
// Format → HTML Export
// ═══════════════════════════════════════════════════════

/**
 * Generates a self-contained HTML file from a RenderedFormat + decoration shapes.
 * The output visually reproduces the chart preview area.
 */
export async function exportFormatAsHTML(
    rendered: RenderedFormat,
    decorationShapes: DecorationShape[],
    options: { fileName?: string; htmlOptions?: HTMLExportOptions } = {}
): Promise<string> {
    const { fileName = 'chart-format' } = options
    const { skeleton, renderedZones, colorPalette } = rendered
    const { width, height } = skeleton.dimensions

    // ── Find the chart zone to generate chart JS ──────
    const chartZone = renderedZones.find(rz => rz.zone.type === 'chart')
    const chartPos = chartZone?.zone.position

    // Generate chart components using existing infrastructure
    let chartComponents = { pluginsScript: '', chartStyles: '', chartContainer: '', chartScript: '' }
    if (chartPos) {
        const baseHtmlOptions: HTMLExportOptions = {
            title: skeleton.name,
            width: chartPos.width,
            height: chartPos.height,
            backgroundColor: 'transparent',
            includeResponsive: true,
            includeAnimations: true,
            includeTooltips: true,
            includeLegend: true,
            fileName: `${fileName}.html`,
            template: "standard",
            ...(options.htmlOptions || {})
        }
        try {
            chartComponents = await generateChartHTMLForTemplate(baseHtmlOptions)
        } catch (e) {
            console.warn('Failed to generate chart HTML for format export:', e)
        }
    }

    // ── Sort zones by rendering order ──────────────────
    const sortedZones = [...renderedZones].sort((a, b) => zoneOrder(a.zone.type) - zoneOrder(b.zone.type))

    // ── Generate zone HTML ────────────────────────────
    const zonesHTML = sortedZones.map(rz => renderZoneHTML(rz, colorPalette, chartComponents)).filter(Boolean).join('\n        ')

    // ── Generate decoration shapes SVG ────────────────
    const decorationsSVG = generateDecorationsSVG(decorationShapes, width, height)

    // ── Build the final HTML ──────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${skeleton.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"><\/script>
    
    <!-- Custom Plugins -->
    <script>
        ${chartComponents.pluginsScript}
    <\/script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f5f5f5;
            display: flex;
            justify-content: center;
            padding: 20px;
        }
        
        .format-container {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .format-zone {
            position: absolute;
            overflow: hidden;
        }
        
        .format-zone-text {
            word-break: break-word;
        }
        
        .format-zone-text ul { list-style-type: disc; padding-left: 16px; margin: 2px 0; }
        .format-zone-text ol { list-style-type: decimal; padding-left: 16px; margin: 2px 0; }
        .format-zone-text li { margin-bottom: 1px; }
        
        .format-zone-stat {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chart-area {
            position: absolute;
            overflow: hidden;
        }
        
        ${chartComponents.chartStyles}
        ${generateDecorationsCSS()}
        
        @media print {
            body { padding: 0; background-color: white; }
            .format-container { border-radius: 0; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="format-container">
        ${zonesHTML}
        ${decorationsSVG}
    </div>
    
    <script>
        ${chartComponents.chartScript}
    <\/script>
</body>
</html>`

    return html
}

// ═══════════════════════════════════════════════════════
// Zone Rendering Helpers
// ═══════════════════════════════════════════════════════

function zoneOrder(type: string): number {
    switch (type) {
        case 'background': return 0
        case 'decoration': return 1
        case 'chart': return 2
        case 'text': return 3
        case 'stat': return 4
        default: return 5
    }
}

function renderZoneHTML(
    rz: RenderedZone,
    palette: any,
    chartComponents: { chartContainer: string }
): string {
    const { zone } = rz

    switch (zone.type) {
        case 'background':
            return renderBackgroundZoneHTML(rz)
        case 'text':
            return renderTextZoneHTML(rz)
        case 'stat':
            return renderStatZoneHTML(rz)
        case 'chart':
            return renderChartZoneHTML(rz, chartComponents)
        case 'decoration':
            return renderDecorationZoneHTML(rz)
        default:
            return ''
    }
}

function renderBackgroundZoneHTML(rz: RenderedZone): string {
    const zone = rz.zone as BackgroundZone
    const style: string[] = ['position:absolute', 'inset:0', 'z-index:0']

    // Image background
    if (rz.resolvedImageUrl) {
        const fit = zone.style.imageFit || 'cover'
        let imgHtml = `<div style="${style.join(';')}">`
        imgHtml += `<img src="${rz.resolvedImageUrl}" alt="" style="width:100%;height:100%;object-fit:${fit}"/>`
        if (zone.style.overlay) {
            imgHtml += `<div style="position:absolute;inset:0;background-color:${zone.style.overlay}"></div>`
        }
        imgHtml += '</div>'
        return imgHtml
    }

    // Gradient background
    if (rz.resolvedGradient) {
        style.push(`background:${rz.resolvedGradient}`)
        return `<div style="${style.join(';')}"></div>`
    }

    // Solid color
    if (zone.style.type === 'solid' && zone.style.color) {
        style.push(`background-color:${zone.style.color}`)
        return `<div style="${style.join(';')}"></div>`
    }

    // Gradient from style
    if (zone.style.type === 'gradient' && zone.style.gradientColor1) {
        const dir = zone.style.gradientDirection || '135deg'
        const c2 = zone.style.gradientColor2 || zone.style.gradientColor1
        style.push(`background:linear-gradient(${dir}, ${zone.style.gradientColor1}, ${c2})`)
        return `<div style="${style.join(';')}"></div>`
    }

    // Pattern
    if (zone.style.type === 'pattern') {
        const color = zone.style.patternColor || '#e2e8f0'
        const opacity = zone.style.patternOpacity || 0.3
        const patternType = zone.style.patternType || 'dots'
        const { styleString } = getPatternCSS(patternType, color, 1)
        
        style.push(`background-color:${zone.style.color || '#ffffff'}`)
        style.push(styleString)
        style.push(`opacity:${opacity}`)
        return `<div style="${style.join(';')}"></div>`
    }

    return ''
}

function renderTextZoneHTML(rz: RenderedZone): string {
    const zone = rz.zone as TextZone
    const pos = zone.position
    if (!pos) return ''

    const text = rz.resolvedContent || ''
    if (!text) return ''

    const hasHtml = /<[a-z][\s\S]*>/i.test(text)

    const style = [
        `left:${pos.x}px`,
        `top:${pos.y}px`,
        `width:${pos.width}px`,
        `height:${pos.height}px`,
        `padding:${4}px`,
        `font-family:${zone.style.fontFamily || 'Inter, sans-serif'}`,
        `font-size:${zone.style.fontSize}px`,
        `font-weight:${zone.style.fontWeight || '400'}`,
        `color:${zone.style.color || '#1a1a2e'}`,
        `text-align:${zone.style.textAlign || 'left'}`,
        `line-height:${zone.style.lineHeight || 1.3}`,
        zone.style.letterSpacing ? `letter-spacing:${zone.style.letterSpacing}px` : '',
        zone.style.fontStyle ? `font-style:${zone.style.fontStyle}` : '',
        zone.style.textTransform && zone.style.textTransform !== 'none' ? `text-transform:${zone.style.textTransform}` : '',
        zone.style.textDecoration && zone.style.textDecoration !== 'none' ? `text-decoration:${zone.style.textDecoration}` : '',
        'word-break:break-word',
        'overflow:hidden',
    ].filter(Boolean).join(';')

    return `<div class="format-zone format-zone-text" style="${style}">${text}</div>`
}

function renderStatZoneHTML(rz: RenderedZone): string {
    const zone = rz.zone as StatZone
    const pos = zone.position
    if (!pos) return ''

    const value = rz.resolvedValue || '—'
    const label = rz.resolvedLabel || ''
    const layout = zone.style.layout || 'vertical'

    const containerStyle = [
        `left:${pos.x}px`,
        `top:${pos.y}px`,
        `width:${pos.width}px`,
        `height:${pos.height}px`,
        'display:flex',
        `flex-direction:${layout === 'vertical' ? 'column' : 'row'}`,
        'align-items:center',
        'justify-content:center',
        'gap:2px',
        'padding:4px',
        `text-align:${zone.style.textAlign || 'center'}`,
    ].join(';')

    const valueStyle = [
        `font-size:${zone.style.valueSize}px`,
        `font-weight:${zone.style.valueFontWeight || '800'}`,
        `font-family:${zone.style.valueFontFamily || 'Inter, sans-serif'}`,
        zone.style.valueFontStyle ? `font-style:${zone.style.valueFontStyle}` : '',
        zone.style.valueTextDecoration && zone.style.valueTextDecoration !== 'none' ? `text-decoration:${zone.style.valueTextDecoration}` : '',
        `color:${zone.style.valueColor || '#1a1a2e'}`,
        'line-height:1.1',
    ].filter(Boolean).join(';')

    const labelStyle = [
        `font-size:${zone.style.labelSize}px`,
        `font-family:${zone.style.labelFontFamily || 'Inter, sans-serif'}`,
        `color:${zone.style.labelColor || '#6b7280'}`,
        'line-height:1.2',
        'text-align:center',
    ].join(';')

    return `<div class="format-zone format-zone-stat" style="${containerStyle}">
        <span style="${valueStyle}">${value}</span>
        ${label ? `<span style="${labelStyle}">${label}</span>` : ''}
    </div>`
}

function renderChartZoneHTML(rz: RenderedZone, chartComponents: { chartContainer: string }): string {
    const pos = rz.zone.position
    if (!pos) return ''

    const style = [
        `left:${pos.x}px`,
        `top:${pos.y}px`,
        `width:${pos.width}px`,
        `height:${pos.height}px`,
        'z-index:1',
    ].join(';')

    return `<div class="chart-area" style="${style}">
        ${chartComponents.chartContainer}
    </div>`
}

function renderDecorationZoneHTML(rz: RenderedZone): string {
    const zone = rz.zone as DecorationZone
    const pos = zone.position
    if (!pos) return ''

    const baseStyle = [
        `left:${pos.x}px`,
        `top:${pos.y}px`,
        `width:${pos.width}px`,
        `height:${pos.height}px`,
        'pointer-events:none',
    ]

    // SVG decoration
    if (zone.subtype === 'svg-icon' && rz.resolvedSvg) {
        baseStyle.push(
            'display:flex',
            'align-items:center',
            'justify-content:center',
            `opacity:${zone.style.svgOpacity || 0.6}`,
            `color:${zone.style.svgColor || '#6b7280'}`
        )
        return `<div class="format-zone" style="${baseStyle.join(';')}">${rz.resolvedSvg}</div>`
    }

    // Border decoration
    if (zone.subtype === 'border') {
        baseStyle.push(
            `border:${zone.style.borderWidth || 1}px ${zone.style.borderStyle || 'solid'} ${zone.style.borderColor || '#e5e7eb'}`,
            zone.style.borderRadius ? `border-radius:${zone.style.borderRadius}px` : ''
        )
        return `<div class="format-zone" style="${baseStyle.filter(Boolean).join(';')}"></div>`
    }

    // Divider decoration
    if (zone.subtype === 'divider') {
        baseStyle.push('display:flex', 'align-items:center', 'justify-content:center')
        const divStyle = [
            'width:100%',
            `height:${zone.style.dividerThickness || 2}px`,
            `background-color:${zone.style.dividerColor || '#e5e7eb'}`,
            'border-radius:1px',
        ].join(';')
        return `<div class="format-zone" style="${baseStyle.join(';')}"><div style="${divStyle}"></div></div>`
    }

    // Shape decoration
    if (zone.subtype === 'shape') {
        baseStyle.push(
            `background-color:${zone.style.shapeColor || '#e5e7eb'}`,
            `opacity:${zone.style.shapeOpacity || 0.3}`,
            zone.style.shapeType === 'circle' ? 'border-radius:50%' : ''
        )
        return `<div class="format-zone" style="${baseStyle.filter(Boolean).join(';')}"></div>`
    }

    return ''
}
