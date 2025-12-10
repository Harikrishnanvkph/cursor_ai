"use client"

import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { generateChartHTML, generateChartHTMLForTemplate, type HTMLExportOptions } from "@/lib/html-exporter"
import html2canvas from 'html2canvas'

export interface TemplateExportOptions {
  format?: 'png' | 'jpeg' | 'html'
  quality?: number
  fileName?: string
  includeTextAreas?: boolean
  scale?: number
  htmlOptions?: HTMLExportOptions
}

/**
 * Helper to convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Map imageFit values to CSS background-size
 */
function getBackgroundSize(fit?: string): string {
  switch (fit) {
    case 'fill':
      return '100% 100%'
    case 'contain':
      return 'contain'
    case 'cover':
      return 'cover'
    default:
      return 'cover'
  }
}

/**
 * Render template or text area background on canvas
 */
async function renderBackgroundOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  background?: {
    type: 'color' | 'gradient' | 'image' | 'transparent'
    color?: string
    gradientType?: 'linear' | 'radial'
    gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg'
    gradientColor1?: string
    gradientColor2?: string
    opacity?: number
    imageUrl?: string
    imageFit?: string
  }
): Promise<void> {
  if (!background || background.type === 'transparent') {
    return
  }

  const opacity = (background.opacity ?? 100) / 100

  if (background.type === 'color' && background.color) {
    ctx.fillStyle = hexToRgba(background.color, opacity)
    ctx.fillRect(x, y, width, height)
  }

  else if (background.type === 'gradient') {
    const color1 = background.gradientColor1 || '#ffffff'
    const color2 = background.gradientColor2 || '#000000'
    const gradientType = background.gradientType || 'linear'

    let gradient: CanvasGradient

    if (gradientType === 'radial') {
      const centerX = x + width / 2
      const centerY = y + height / 2
      const radius = Math.max(width, height) / 2
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    } else {
      // Linear gradient
      const direction = background.gradientDirection || 'to right'
      let x0 = x, y0 = y, x1 = x, y1 = y

      switch (direction) {
        case 'to right':
          x1 = x + width
          break
        case 'to left':
          x0 = x + width
          break
        case 'to bottom':
          y1 = y + height
          break
        case 'to top':
          y0 = y + height
          break
        case '135deg':
          x1 = x + width
          y1 = y + height
          break
      }

      gradient = ctx.createLinearGradient(x0, y0, x1, y1)
    }

    gradient.addColorStop(0, hexToRgba(color1, opacity))
    gradient.addColorStop(1, hexToRgba(color2, opacity))

    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
  }

  else if (background.type === 'image' && background.imageUrl) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        ctx.save()

        // Apply opacity by setting global alpha
        if (opacity < 1) {
          ctx.globalAlpha = opacity
        }

        // Calculate dimensions based on imageFit
        const fit = background.imageFit || 'cover'
        let dx = x, dy = y, dw = width, dh = height

        if (fit === 'fill') {
          // Stretch to fill
          ctx.drawImage(img, dx, dy, dw, dh)
        } else if (fit === 'contain') {
          // Fit inside
          const scale = Math.min(width / img.width, height / img.height)
          dw = img.width * scale
          dh = img.height * scale
          dx = x + (width - dw) / 2
          dy = y + (height - dh) / 2
          ctx.drawImage(img, dx, dy, dw, dh)
        } else { // cover
          // Cover entire area
          const scale = Math.max(width / img.width, height / img.height)
          dw = img.width * scale
          dh = img.height * scale
          dx = x + (width - dw) / 2
          dy = y + (height - dh) / 2
          ctx.drawImage(img, dx, dy, dw, dh)
        }

        ctx.restore()
        resolve()
      }

      img.onerror = () => {
        console.warn('Failed to load background image:', background.imageUrl)
        resolve()
      }

      img.src = background.imageUrl
    })
  }
}

/**
 * Renders HTML content to a canvas using html2canvas for PIXEL-PERFECT matching
 * This captures the actual rendered HTML exactly as it appears in the browser
 */
async function renderHTMLToCanvas(
  htmlContent: string,
  width: number,
  height: number,
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: string | number
    color: string
    textAlign: string
    lineHeight: number
    letterSpacing: number
  },
  scale: number = 1
): Promise<HTMLCanvasElement> {
  // Create a temporary container that matches the text area styling exactly
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    font-size: ${style.fontSize}px;
    font-family: ${style.fontFamily};
    font-weight: ${style.fontWeight};
    color: ${style.color};
    text-align: ${style.textAlign};
    line-height: ${style.lineHeight};
    letter-spacing: ${style.letterSpacing}px;
    padding: 8px;
    box-sizing: border-box;
    overflow: hidden;
    word-wrap: break-word;
    white-space: normal;
    background: transparent;
  `
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  try {
    // Use html2canvas to capture the exact rendering
    const canvas = await html2canvas(container, {
      scale: scale,
      backgroundColor: null, // Transparent background
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: width,
      height: height,
    })

    return canvas
  } finally {
    // Clean up the temporary container
    document.body.removeChild(container)
  }
}

/**
 * Draw plain text content on canvas with word wrapping
 */
function drawPlainText(
  ctx: CanvasRenderingContext2D,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: string | number
    color: string
    textAlign: string
    lineHeight: number
    letterSpacing: number
  },
  padding: number
): void {
  const fontSize = style.fontSize
  const lineHeight = fontSize * style.lineHeight

  // Set text styles
  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  ctx.fillStyle = style.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // Apply letter spacing if supported
  const letterSpacing = style.letterSpacing || 0
  if ('letterSpacing' in ctx && letterSpacing !== 0) {
    (ctx as any).letterSpacing = `${letterSpacing}px`
  }

  // Split content by newlines
  const lines = content.split('\n')
  let currentY = y + padding

  lines.forEach((line) => {
    const words = line.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      const availableWidth = width - (padding * 2)

      if (metrics.width > availableWidth && currentLine) {
        const lineText = currentLine.trim()
        if (lineText) {
          let textX = x + padding
          if (style.textAlign === 'center') {
            const lineWidth = ctx.measureText(lineText).width
            textX = x + (width - lineWidth) / 2
          } else if (style.textAlign === 'right') {
            const lineWidth = ctx.measureText(lineText).width
            textX = x + width - lineWidth - padding
          }

          ctx.fillText(lineText, textX, currentY)
        }

        currentLine = word
        currentY += lineHeight

        if (currentY + lineHeight > y + height - padding) {
          return
        }
      } else {
        currentLine = testLine
      }
    }

    const lineText = currentLine.trim()
    if (lineText) {
      let textX = x + padding
      if (style.textAlign === 'center') {
        const lineWidth = ctx.measureText(lineText).width
        textX = x + (width - lineWidth) / 2
      } else if (style.textAlign === 'right') {
        const lineWidth = ctx.measureText(lineText).width
        textX = x + width - lineWidth - padding
      }

      ctx.fillText(lineText, textX, currentY)
    }

    currentY += lineHeight
  })
}

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
  const { format = 'png', quality = 1, fileName = 'chart-template', scale = 4 } = options

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