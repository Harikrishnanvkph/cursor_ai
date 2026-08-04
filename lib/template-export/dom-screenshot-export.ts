"use client"

import html2canvas from 'html2canvas'
import { toast } from 'sonner'

export interface DOMScreenshotOptions {
  width: number
  height: number
  scale?: number
  format?: 'png' | 'jpeg'
  quality?: number
  fileName?: string
}

/**
 * Export a DOM element as a pixel-perfect image by screenshotting it with html2canvas.
 * This captures everything exactly as the browser renders it — chart canvas, text areas,
 * decorations SVG, backgrounds, patterns, custom fonts — all in one shot.
 */
export async function exportDOMElementAsImage(
  element: HTMLElement,
  options: DOMScreenshotOptions
): Promise<void> {
  const {
    width,
    height,
    scale = 4,
    format = 'png',
    quality = 1,
    fileName = `chart-export-${new Date().toISOString().slice(0, 10)}`
  } = options

  const toastId = 'dom-screenshot-export'
  toast.loading('Preparing image export...', { id: toastId })

  // Save original styles so we can restore them after screenshot
  const origTransform = element.style.transform
  const origTransformOrigin = element.style.transformOrigin

  try {
    // 1. Add export-mode class to hide UI-only elements (guides, selection rings, hover effects)
    element.classList.add('dom-export-mode')

    // 2. Strip CSS transforms (zoom/pan) so html2canvas captures at native resolution
    element.style.transform = 'none'
    element.style.transformOrigin = 'top left'

    // 3. Wait for the browser to repaint with the cleaned-up state
    await new Promise(resolve => setTimeout(resolve, 150))

    // 4. Capture the DOM element with html2canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: null, // Preserve transparency
      useCORS: true,
      allowTaint: true,
      width,
      height,
      logging: false,
      // Ignore elements marked for export exclusion
      ignoreElements: (el: Element) => {
        return el.hasAttribute('data-export-ignore')
      }
    })

    // 5. Convert canvas to blob and trigger download
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const dataUrl = canvas.toDataURL(mimeType, quality)

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${fileName}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Image downloaded successfully!', { id: toastId })
  } catch (error) {
    console.error('DOM screenshot export failed:', error)
    toast.error('Failed to export image. Please try again.', { id: toastId })
    throw error
  } finally {
    // 6. Always restore original state
    element.classList.remove('dom-export-mode')
    element.style.transform = origTransform
    element.style.transformOrigin = origTransformOrigin
  }
}
