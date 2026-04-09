"use client"

import type { DecorationShape } from "@/lib/stores/decoration-store"

// ═══════════════════════════════════════════════════════
// SVG Path Generators (mirrored from DecorationShapeRenderer)
// ═══════════════════════════════════════════════════════

function cloudPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2, cy = y + h / 2
  const rx = w / 2, ry = h / 2
  const bumps = 12
  const points: string[] = []
  for (let i = 0; i < bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2
    const nextAngle = ((i + 1) / bumps) * Math.PI * 2
    const midAngle = (angle + nextAngle) / 2
    const bumpDepth = 0.18

    const px = cx + rx * Math.cos(angle)
    const py = cy + ry * Math.sin(angle)
    const cpx = cx + rx * (1 + bumpDepth) * Math.cos(midAngle)
    const cpy = cy + ry * (1 + bumpDepth) * Math.sin(midAngle)
    const ex = cx + rx * Math.cos(nextAngle)
    const ey = cy + ry * Math.sin(nextAngle)

    if (i === 0) points.push(`M ${px} ${py}`)
    points.push(`Q ${cpx} ${cpy} ${ex} ${ey}`)
  }
  points.push('Z')
  return points.join(' ')
}

function cloudLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1], p2 = points[i]
    const dx = p2.x - p1.x, dy = p2.y - p1.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const bumpSize = 25
    const bumps = Math.max(1, Math.round(dist / bumpSize))

    for (let j = 0; j < bumps; j++) {
      const t2 = (j + 1) / bumps
      const endX = p1.x + dx * t2
      const endY = p1.y + dy * t2
      const segmentDist = dist / bumps
      const radius = segmentDist / 2
      d += ` A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
    }
  }
  return d
}

function polygonPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z'
}

function connectedLinesPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
}

function freehandPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return d + ` L ${points[1].x} ${points[1].y}`
  }
  for (let i = 1; i < points.length - 1; i++) {
    const cpX = points[i].x
    const cpY = points[i].y
    const nextX = points[i + 1].x
    const nextY = points[i + 1].y
    const midX = (cpX + nextX) / 2
    const midY = (cpY + nextY) / 2
    d += ` Q ${cpX} ${cpY} ${midX} ${midY}`
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
  return d
}

function regularPolygon(x: number, y: number, w: number, h: number, sides: number): { x: number; y: number }[] {
  const cx = x + w / 2, cy = y + h / 2
  const rx = w / 2, ry = h / 2
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    pts.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) })
  }
  return pts
}

function getStrokeDasharray(style: string): string | undefined {
  switch (style) {
    case 'dashed': return '8,6'
    case 'dotted': return '2,4'
    default: return undefined
  }
}

function getStampContent(type: string): string | null {
  if (type.startsWith('num-')) return type.replace('num-', '')
  switch (type) {
    case 'emoji-star': return '⭐'
    case 'emoji-warning': return '⚠️'
    case 'emoji-heart': return '❤️'
    case 'emoji-thumb': return '👍'
    case 'emoji-fire': return '🔥'
    case 'emoji-idea': return '💡'
    case 'emoji-check': return '✅'
    case 'emoji-cross': return '❌'
    case 'emoji-smile': return '😊'
    case 'emoji-sad': return '😢'
    case 'emoji-rocket': return '🚀'
    case 'emoji-target': return '🎯'
    case 'emoji-laugh': return '😂'
    case 'exclamation': return '❗'
    case 'question': return '❓'
    case 'pushpin': return '📌'
    case 'bullseye': return '◎'
  }
  return null
}

const LINE_LIKE_TYPES = ['line', 'arrow', 'double-arrow', 'connected-lines', 'freehand']
const POINTS_BASED_TYPES = [...LINE_LIKE_TYPES, 'polygon', 'cloud-line']

function isLineLike(type: string) { return LINE_LIKE_TYPES.includes(type) }
function isPointsBased(type: string) { return POINTS_BASED_TYPES.includes(type) }

function getShapeBounds(shape: DecorationShape): { x: number; y: number; width: number; height: number } {
  if (shape.points && shape.points.length >= 2 && isPointsBased(shape.type)) {
    const xs = shape.points.map(p => p.x)
    const ys = shape.points.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    const PAD = 12
    const w = Math.max(maxX - minX, PAD * 2)
    const h = Math.max(maxY - minY, PAD * 2)
    return {
      x: minX - (w === PAD * 2 ? PAD - (maxX - minX) / 2 : 0),
      y: minY - (h === PAD * 2 ? PAD - (maxY - minY) / 2 : 0),
      width: w, height: h
    }
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}

// ═══════════════════════════════════════════════════════
// Single Shape → SVG Element String
// ═══════════════════════════════════════════════════════

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shapeSVGContent(shape: DecorationShape): string {
  const { x, y, width: w, height: h, fillColor, fillOpacity, strokeColor, strokeWidth, strokeStyle, rotation, type } = shape
  const fill = isLineLike(type) ? 'none' : fillColor
  const opacity = fillOpacity / 100
  const dash = getStrokeDasharray(strokeStyle)
  const bounds = getShapeBounds(shape)
  const transform = rotation ? `rotate(${rotation} ${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2})` : ''
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : ''
  const commonAttrs = `stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr} stroke-linecap="round" stroke-linejoin="round"${transform ? ` transform="${transform}"` : ''}`

  // Stamp content (emojis, numbers)
  const stampText = getStampContent(type)
  if (stampText) {
    const tAttr = transform ? ` transform="${transform}"` : ''
    const isBold = type.startsWith('num-')
    const fillAttr = isBold ? (fillColor !== 'transparent' ? fillColor : strokeColor) : ''
    return `<g${tAttr}>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>
      <text x="${x + w / 2}" y="${y + h / 2 + Math.min(w, h) * 0.05}" font-size="${Math.min(w, h) * 0.8}" font-family="sans-serif" font-weight="${isBold ? 'bold' : 'normal'}" text-anchor="middle" dominant-baseline="middle"${fillAttr ? ` fill="${fillAttr}"` : ''} style="user-select:none;pointer-events:none">${stampText}</text>
    </g>`
  }

  switch (type) {
    case 'rectangle':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="${opacity}" rx="2" ${commonAttrs}/>`

    case 'circle':
      return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`

    case 'triangle':
      return `<polygon points="${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`

    case 'star': {
      const cx = x + w / 2, cy = y + h / 2
      const outerR = Math.min(w, h) / 2, innerR = outerR * 0.382
      const pts = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const angle = (Math.PI / 5) * i - Math.PI / 2
        pts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`)
      }
      return `<polygon points="${pts.join(' ')}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`
    }

    case 'checkmark':
      return `<path d="M ${x + w * 0.2} ${y + h * 0.5} L ${x + w * 0.4} ${y + h * 0.75} L ${x + w * 0.8} ${y + h * 0.25}" fill="none" ${commonAttrs}/>`

    case 'crossmark':
      return `<g>
        <line x1="${x + w * 0.2}" y1="${y + h * 0.2}" x2="${x + w * 0.8}" y2="${y + h * 0.8}" ${commonAttrs}/>
        <line x1="${x + w * 0.8}" y1="${y + h * 0.2}" x2="${x + w * 0.2}" y2="${y + h * 0.8}" ${commonAttrs}/>
      </g>`

    case 'dot':
      return `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2 * 0.8}" fill="${strokeColor}"/>`

    case 'line': {
      const pts = shape.points
      if (pts && pts.length >= 2) {
        const [p1, p2] = pts
        const tAttr = transform ? ` transform="${transform}"` : ''
        return `<g${tAttr}>
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr} stroke-linecap="round" stroke-linejoin="round"/>
        </g>`
      }
      return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" ${commonAttrs}/>`
    }

    case 'arrow':
    case 'double-arrow': {
      const pts = shape.points
      if (pts && pts.length >= 2) {
        const [p1, p2] = pts
        const dx = p2.x - p1.x, dy = p2.y - p1.y
        const angle = Math.atan2(dy, dx)
        const arrowSize = Math.max(10, Math.min(Math.sqrt(dx * dx + dy * dy) * 0.12, 18))
        const lineAttrs = `stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr} stroke-linecap="round" stroke-linejoin="round"`
        const tAttr = transform ? ` transform="${transform}"` : ''
        let svg = `<g${tAttr}>
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" ${lineAttrs}/>
          <line x1="${p2.x - arrowSize * Math.cos(angle - 0.4)}" y1="${p2.y - arrowSize * Math.sin(angle - 0.4)}" x2="${p2.x}" y2="${p2.y}" ${lineAttrs}/>
          <line x1="${p2.x - arrowSize * Math.cos(angle + 0.4)}" y1="${p2.y - arrowSize * Math.sin(angle + 0.4)}" x2="${p2.x}" y2="${p2.y}" ${lineAttrs}/>`
        if (type === 'double-arrow') {
          svg += `
          <line x1="${p1.x + arrowSize * Math.cos(angle - 0.4)}" y1="${p1.y + arrowSize * Math.sin(angle - 0.4)}" x2="${p1.x}" y2="${p1.y}" ${lineAttrs}/>
          <line x1="${p1.x + arrowSize * Math.cos(angle + 0.4)}" y1="${p1.y + arrowSize * Math.sin(angle + 0.4)}" x2="${p1.x}" y2="${p1.y}" ${lineAttrs}/>`
        }
        svg += '</g>'
        return svg
      }
      return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" ${commonAttrs}/>`
    }

    case 'cloud':
      return `<path d="${cloudPath(x, y, w, h)}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`

    case 'polygon':
      if (shape.points && shape.points.length >= 3) {
        return `<path d="${polygonPath(shape.points)}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`
      }
      return `<path d="${polygonPath(regularPolygon(x, y, w, h, 6))}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`

    case 'connected-lines':
      if (shape.points && shape.points.length >= 2) {
        return `<path d="${connectedLinesPath(shape.points)}" fill="none" ${commonAttrs}/>`
      }
      return `<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${commonAttrs}/>`

    case 'cloud-line':
      if (shape.points && shape.points.length >= 2) {
        return `<path d="${cloudLinePath(shape.points)}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`
      }
      return `<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${commonAttrs}/>`

    case 'freehand':
      if (shape.points && shape.points.length >= 2) {
        return `<path d="${freehandPath(shape.points)}" fill="none" ${commonAttrs}/>`
      }
      return ''

    case 'text-callout': {
      const tailH = Math.min(20, h * 0.3)
      const boxH = h - tailH
      const tAttr = transform ? ` transform="${transform}"` : ''
      return `<g${tAttr}>
        <rect x="${x}" y="${y}" width="${w}" height="${boxH}" fill="${fill}" fill-opacity="${opacity}" rx="6" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr}/>
        <polygon points="${x + w * 0.3},${y + boxH} ${x + w * 0.5},${y + h} ${x + w * 0.5},${y + boxH}" fill="${fill}" fill-opacity="${opacity}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        ${shape.text ? `<foreignObject x="${x + 6}" y="${y + 4}" width="${w - 12}" height="${boxH - 8}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;color:${strokeColor};word-break:break-word;line-height:1.3">${shape.text}</div></foreignObject>` : ''}
      </g>`
    }

    case 'textbox':
    case 'textbox-auto': {
      const fSize = shape.fontSize || 14
      const tAttr = transform ? ` transform="${transform}"` : ''
      const hasHtml = shape.text ? /<[a-z][\s\S]*>/i.test(shape.text) : false
      const textContent = shape.text || ''
      return `<g${tAttr}>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="${opacity}" rx="4" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr}/>
        ${textContent ? `<foreignObject x="${x + 4}" y="${y + 4}" width="${Math.max(0, w - 8)}" height="${Math.max(0, h - 8)}">
          <div xmlns="http://www.w3.org/1999/xhtml" class="deco-textbox-export" style="width:100%;height:100%;font-size:${fSize}px;font-family:${shape.fontFamily || 'Arial'};font-weight:${shape.fontWeight || 'normal'};font-style:${shape.fontStyle || 'normal'};text-decoration:${shape.textDecoration || 'none'};text-align:${shape.textAlign || 'left'};color:${shape.textColor || strokeColor};line-height:${shape.lineHeight || 1.4};word-break:break-word;white-space:pre-wrap;user-select:none;pointer-events:none">${hasHtml ? textContent : escapeHtml(textContent)}</div>
        </foreignObject>` : ''}
      </g>`
    }

    case 'deco-image': {
      const tAttr = transform ? ` transform="${transform}"` : ''
      const pmap: Record<string, string> = { fill: 'none', cover: 'xMidYMid slice', contain: 'xMidYMid meet' }
      const par = shape.imageFit ? pmap[shape.imageFit] : 'xMidYMid slice'
      const rx = shape.borderRadius || 0
      const clipId = `clip-export-${shape.id || Math.random().toString(36).substr(2, 9)}`
      let svg = `<g${tAttr}>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="${opacity}" rx="${rx}" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr}/>`
      if (shape.imageUrl) {
        if (rx > 0) {
          svg += `<defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath></defs>`
        }
        svg += `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${shape.imageUrl}" preserveAspectRatio="${par}"${rx > 0 ? ` clip-path="url(#${clipId})"` : ''} style="pointer-events:none"/>`
      }
      svg += '</g>'
      return svg
    }

    case 'deco-svg': {
      const tAttr = transform ? ` transform="${transform}"` : ''
      return `<g${tAttr}>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent" stroke="none"/>
        ${shape.svgContent ? `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;pointer-events:none;display:flex;align-items:center;justify-content:center">${shape.svgContent}</div></foreignObject>` : ''}
      </g>`
    }

    default:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" fill-opacity="${opacity}" ${commonAttrs}/>`
  }
}

// ═══════════════════════════════════════════════════════
// Public API: Generate decoration layer HTML
// ═══════════════════════════════════════════════════════

/**
 * Generate an SVG element containing all decoration shapes.
 * Returns a complete SVG string that can be placed inside the template container.
 */
export function generateDecorationsSVG(
  shapes: DecorationShape[],
  containerWidth: number,
  containerHeight: number
): string {
  const visibleShapes = shapes
    .filter(s => s.visible)
    .sort((a, b) => a.zIndex - b.zIndex)

  if (visibleShapes.length === 0) return ''

  const svgContent = visibleShapes.map(shape => shapeSVGContent(shape)).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" class="decorations-layer" width="${containerWidth}" height="${containerHeight}" viewBox="0 0 ${containerWidth} ${containerHeight}" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;overflow:visible">
    ${svgContent}
  </svg>`
}

/**
 * Generate CSS for decoration text boxes in the exported HTML
 */
export function generateDecorationsCSS(): string {
  return `
    .decorations-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; overflow: visible; }
    .deco-textbox-export p, .deco-textbox-export div { margin: 0; padding: 0; }
    .deco-textbox-export ul { list-style-type: disc; padding-left: 16px; margin: 2px 0; }
    .deco-textbox-export ol { list-style-type: decimal; padding-left: 16px; margin: 2px 0; }
    .deco-textbox-export li { margin-bottom: 1px; }
  `
}
