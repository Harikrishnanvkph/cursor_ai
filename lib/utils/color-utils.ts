/**
 * Shared color utility functions.
 * Consolidates duplicated color helpers from dataset-settings, chart-state-service, etc.
 */

// ──────────────────── Palette Generation ────────────────────

export function generateColorPalette(count: number): string[] {
    const baseColors = [
        '#1976d2', // Blue
        '#2e7d32', // Green
        '#c62828', // Red
        '#f9a825', // Yellow
        '#6a1b9a', // Purple
        '#00838f', // Teal
        '#ef6c00', // Orange
        '#4a148c', // Deep Purple
        '#00695c', // Dark Teal
        '#bf360c', // Deep Orange
    ]

    if (count <= baseColors.length) {
        return baseColors.slice(0, count)
    }

    // Generate additional colors if needed
    const additionalColors: string[] = []
    for (let i = 0; i < count - baseColors.length; i++) {
        const hue = (i * 137.5) % 360 // Golden angle approximation
        additionalColors.push(`hsl(${hue}, 70%, 50%)`)
    }

    return [...baseColors, ...additionalColors]
}

// ──────────────────── Color Darkening ────────────────────

/** Darken a color by a given percentage. Supports hex, rgba, rgb, and hsl. */
export function darkenColor(color: string, percent: number): string {
    // Handle HSL colors
    if (color.startsWith("hsl")) {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
            const [, h, s, l] = match
            const newL = Math.max(0, Number.parseInt(l) - percent)
            return `hsl(${h}, ${s}%, ${newL}%)`
        }
    }

    // Handle hex colors
    if (color.startsWith("#")) {
        const hex = color.replace("#", "")
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)

        const factor = 1 - percent / 100
        const newR = Math.max(0, Math.round(r * factor))
        const newG = Math.max(0, Math.round(g * factor))
        const newB = Math.max(0, Math.round(b * factor))

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    }

    // Handle rgba/rgb colors
    if (color.startsWith("rgba") || color.startsWith("rgb")) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        if (match) {
            const [, r, g, b, a] = match
            const factor = 1 - percent / 100
            const newR = Math.max(0, Math.round(parseInt(r) * factor))
            const newG = Math.max(0, Math.round(parseInt(g) * factor))
            const newB = Math.max(0, Math.round(parseInt(b) * factor))

            if (a !== undefined) {
                return `rgba(${newR}, ${newG}, ${newB}, ${a})`
            }
            return `rgb(${newR}, ${newG}, ${newB})`
        }
    }

    return color
}

// ──────────────────── Color Conversion ────────────────────

/** Convert an RGBA/RGB string to a hex string. Returns input if already hex. */
export function rgbaToHex(rgba: string): string {
    if (rgba.startsWith('#')) return rgba

    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (match) {
        const [, r, g, b] = match
        return `#${[r, g, b].map(x => {
            const hex = parseInt(x).toString(16)
            return hex.length === 1 ? '0' + hex : hex
        }).join('')}`
    }

    return rgba || '#3b82f6'
}

/** Convert a hex color to rgba with a given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Extract the hex color from any color format (rgba → hex, hex → hex).
 * Useful for feeding into `<input type="color">` which only accepts hex.
 */
export function getHexFromColor(color: string): string {
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0')
            const g = parseInt(match[2]).toString(16).padStart(2, '0')
            const b = parseInt(match[3]).toString(16).padStart(2, '0')
            return `#${r}${g}${b}`
        }
    }
    return color
}

// ──────────────────── Opacity ────────────────────

/** Apply opacity to any color format (hex, rgba, rgb, hsl). */
export function applyOpacityToColor(color: string | undefined, opacityPercent: number): string {
    if (!color) return 'rgba(59, 130, 246, 1)' // Default blue

    const alpha = opacityPercent / 100

    // Handle hex colors
    if (color.startsWith('#')) {
        return hexToRgba(color, alpha)
    }

    // Handle rgba colors - replace the alpha value
    if (color.startsWith('rgba')) {
        return color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1, $2, $3, ${alpha})`)
    }

    // Handle rgb colors - convert to rgba
    if (color.startsWith('rgb')) {
        return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, `rgba($1, $2, $3, ${alpha})`)
    }

    // Handle hsl colors - convert to rgba
    if (color.startsWith('hsl')) {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
            const h = parseInt(match[1])
            const s = parseInt(match[2]) / 100
            const l = parseInt(match[3]) / 100

            const c = (1 - Math.abs(2 * l - 1)) * s
            const x = c * (1 - Math.abs((h / 60) % 2 - 1))
            const m = l - c / 2

            let r = 0, g = 0, b = 0
            if (h < 60) { r = c; g = x; b = 0 }
            else if (h < 120) { r = x; g = c; b = 0 }
            else if (h < 180) { r = 0; g = c; b = x }
            else if (h < 240) { r = 0; g = x; b = c }
            else if (h < 300) { r = x; g = 0; b = c }
            else { r = c; g = 0; b = x }

            const red = Math.round((r + m) * 255)
            const green = Math.round((g + m) * 255)
            const blue = Math.round((b + m) * 255)

            return `rgba(${red}, ${green}, ${blue}, ${alpha})`
        }
    }

    return color
}
