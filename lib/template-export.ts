"use client"

import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"

export interface TemplateExportOptions {
  format: 'png' | 'jpeg' | 'html'
  quality?: number
  fileName?: string
  includeTextAreas?: boolean
  scale?: number
}

export const exportTemplateAsImage = async (
  template: TemplateLayout,
  chartCanvas: HTMLCanvasElement,
  options: TemplateExportOptions
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

  // Draw chart area
  if (chartCanvas) {
    // Ensure the chart canvas is properly sized for the template
    const chartCanvasScaled = document.createElement('canvas')
    const chartCtx = chartCanvasScaled.getContext('2d')
    
    if (chartCtx) {
      chartCanvasScaled.width = template.chartArea.width
      chartCanvasScaled.height = template.chartArea.height
      
      // Draw the original chart canvas onto the properly sized canvas
      chartCtx.drawImage(
        chartCanvas,
        0, 0, chartCanvas.width, chartCanvas.height,
        0, 0, template.chartArea.width, template.chartArea.height
      )
      
      // Draw the properly sized chart onto the template
      ctx.drawImage(
        chartCanvasScaled,
        template.chartArea.x,
        template.chartArea.y,
        template.chartArea.width,
        template.chartArea.height
      )
    }
  }

  // Draw text areas
  template.textAreas.forEach(textArea => {
    if (!textArea.visible) return

    const { x, y, width, height } = textArea.position
    const style = textArea.style

    // Set text styles
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    ctx.fillStyle = style.color
    ctx.textAlign = style.textAlign as CanvasTextAlign
    ctx.textBaseline = 'top'

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

  // Convert to data URL
  return canvas.toDataURL(`image/${format}`, quality)
}

export const exportTemplateAsHTML = async (
  template: TemplateLayout,
  chartData: any,
  chartConfig: any,
  options: TemplateExportOptions
): Promise<string> => {
  const { fileName = 'chart-template' } = options

  // Create HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
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
        }
        .chart-area {
            position: absolute;
            left: ${template.chartArea.x}px;
            top: ${template.chartArea.y}px;
            width: ${template.chartArea.width}px;
            height: ${template.chartArea.height}px;
        }
        .chart-canvas {
            width: ${template.chartArea.width}px !important;
            height: ${template.chartArea.height}px !important;
        }
        .text-area {
            position: absolute;
            overflow: hidden;
            word-wrap: break-word;
            white-space: pre-wrap;
            padding: 8px;
            box-sizing: border-box;
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
            }
        }
    </style>
</head>
<body>
    <div class="template-container">
        <div class="chart-area">
            <canvas id="chartCanvas" class="chart-canvas" width="${template.chartArea.width}" height="${template.chartArea.height}"></canvas>
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
        // Chart.js configuration
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        const chartData = ${JSON.stringify(chartData)};
        const chartConfig = ${JSON.stringify(chartConfig)};
        
        new Chart(ctx, {
            type: '${chartConfig.type || 'bar'}',
            data: chartData,
            options: {
                ...chartConfig,
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    ...chartConfig.plugins,
                    legend: {
                        ...chartConfig.plugins?.legend,
                        display: false
                    }
                }
            }
        });
    </script>
</body>
</html>`

  return html
}

export const downloadTemplateExport = async (
  template: TemplateLayout,
  chartCanvas: HTMLCanvasElement | null,
  chartData: any,
  chartConfig: any,
  options: TemplateExportOptions
): Promise<void> => {
  const { format, fileName = 'chart-template' } = options

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