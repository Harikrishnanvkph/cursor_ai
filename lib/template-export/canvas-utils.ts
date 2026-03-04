"use client"

import html2canvas from 'html2canvas'

/**
 * Helper to convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
    hex = hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Map imageFit values to CSS background-size
 */
export function getBackgroundSize(fit?: string): string {
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
export async function renderBackgroundOnCanvas(
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
        blur?: number
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

                // Clip to the target area to prevent spillover (especially for 'cover' fit)
                ctx.beginPath()
                ctx.rect(x, y, width, height)
                ctx.clip()

                // Apply opacity by setting global alpha
                if (opacity < 1) {
                    ctx.globalAlpha = opacity
                }

                // Apply blur if specified
                if (background.blur) {
                    ctx.filter = `blur(${background.blur}px)`
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

                // Reset filter
                ctx.filter = 'none'

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
export async function renderHTMLToCanvas(
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
    // Create a style element with all the necessary CSS
    const styleEl = document.createElement('style')
    styleEl.textContent = `
    .export-html-container ul,
    .export-html-container ol {
      list-style: none;
      padding-left: 0;
      margin: 0.5em 0;
    }
    .export-html-container li {
      margin: 0.25em 0;
      padding-left: 1.5em;
      position: relative;
    }
    .export-html-container ul > li::before {
      content: "•";
      position: absolute;
      left: 0;
      top: 0;
      font-size: 1em;
      line-height: inherit;
    }
    .export-html-container ol {
      counter-reset: list-counter;
    }
    .export-html-container ol > li {
      counter-increment: list-counter;
    }
    .export-html-container ol > li::before {
      content: counter(list-counter) ".";
      position: absolute;
      left: 0;
      top: 0;
      font-size: 1em;
      line-height: inherit;
    }
    /* Nested list styling */
    .export-html-container ul ul > li::before { content: "◦"; }
    .export-html-container ul ul ul > li::before { content: "▪"; }
    .export-html-container ol ol { counter-reset: nested-counter; }
    .export-html-container ol ol > li { counter-increment: nested-counter; }
    .export-html-container ol ol > li::before { content: counter(nested-counter, lower-alpha) "."; }
    .export-html-container h1 {
      font-size: 2em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container h3 {
      font-size: 1.17em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container h4 {
      font-size: 1em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container h5 {
      font-size: 0.83em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container h6 {
      font-size: 0.67em;
      font-weight: bold;
      margin: 8px 0;
      display: block;
    }
    .export-html-container p {
      margin: 0.5em 0;
      display: block;
    }
    /* Image styling to prevent overlay */
    .export-html-container img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0.5em 0;
    }
    /* Remove top margin from first element, bottom margin from last element */
    .export-html-container > h1:first-child,
    .export-html-container > h2:first-child,
    .export-html-container > h3:first-child,
    .export-html-container > h4:first-child,
    .export-html-container > h5:first-child,
    .export-html-container > h6:first-child,
    .export-html-container > p:first-child,
    .export-html-container > ul:first-child,
    .export-html-container > ol:first-child {
      margin-top: 0;
    }
    .export-html-container > h1:last-child,
    .export-html-container > h2:last-child,
    .export-html-container > h3:last-child,
    .export-html-container > h4:last-child,
    .export-html-container > h5:last-child,
    .export-html-container > h6:last-child,
    .export-html-container > p:last-child,
    .export-html-container > ul:last-child,
    .export-html-container > ol:last-child {
      margin-bottom: 0;
    }
  `
    document.head.appendChild(styleEl)

    // Create a temporary container that matches the text area styling exactly
    const container = document.createElement('div')
    container.className = 'export-html-container'
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
    overflow: visible;
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
        // Clean up the temporary container and style element
        document.body.removeChild(container)
        document.head.removeChild(styleEl)
    }
}

/**
 * Draw plain text content on canvas with word wrapping
 */
export function drawPlainText(
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
