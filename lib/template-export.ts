"use client"

import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { generateChartHTML, generateChartHTMLForTemplate, type HTMLExportOptions } from "@/lib/html-exporter"

export interface TemplateExportOptions {
  format?: 'png' | 'jpeg' | 'html'
  quality?: number
  fileName?: string
  includeTextAreas?: boolean
  scale?: number
  htmlOptions?: HTMLExportOptions
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
  options: TemplateExportOptions
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

  // Scale the context for high resolution
  ctx.scale(scale, scale)

  // Draw background
  ctx.fillStyle = template.backgroundColor
  ctx.fillRect(0, 0, template.width, template.height)

  // Draw border
  if (template.borderWidth > 0) {
    ctx.strokeStyle = template.borderColor
    ctx.lineWidth = template.borderWidth
    ctx.strokeRect(0, 0, template.width, template.height)
  }

  // Draw chart area with high quality
  if (chartCanvas) {
    try {
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

  // Draw text areas with high quality
  template.textAreas.forEach(textArea => {
    if (!textArea.visible) return

    const { x, y, width, height } = textArea.position
    const style = textArea.style

    // Set text styles with high quality
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    ctx.fillStyle = style.color
    ctx.textAlign = style.textAlign as CanvasTextAlign
    ctx.textBaseline = 'top'
    
    // Enable high-quality text rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Handle text wrapping and positioning
    const words = textArea.content.split(' ')
    let line = ''
    let lineHeight = style.fontSize * style.lineHeight
    let currentY = y + 8 // Add padding to match preview

    // Calculate text position based on alignment
    let textX = x + 8 // Add left padding
    if (style.textAlign === 'center') {
      textX = x + width / 2
    } else if (style.textAlign === 'right') {
      textX = x + width - 8 // Subtract right padding
    }

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > width - 16 && i > 0) { // Account for padding
        ctx.fillText(line, textX, currentY)
        line = words[i] + ' '
        currentY += lineHeight
        
        // Check if we've exceeded the height
        if (currentY + lineHeight > y + height - 8) {
          break
        }
      } else {
        line = testLine
      }
    }
    
    // Draw the last line
    if (line.trim()) {
      ctx.fillText(line, textX, currentY)
    }
  })

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
            background-color: ${template.backgroundColor};
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
            white-space: pre-wrap;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 4px;
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
          .map(textArea => `
            <div class="text-area" style="
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
            ">${textArea.content}</div>
          `).join('')}
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
            background-color: ${template.backgroundColor};
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
            white-space: pre-wrap;
            padding: 8px;
            box-sizing: border-box;
            border-radius: 4px;
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
          .map(textArea => `
            <div class="text-area" style="
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
            ">${textArea.content}</div>
          `).join('')}
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

      dataUrl = await exportTemplateAsImage(template, chartCanvas, options)
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