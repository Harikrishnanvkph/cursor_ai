"use client"

import React, { useRef, useCallback, useEffect, useState } from "react"
import { useDecorationStore, type DecorationShape, type DrawingState, type GlobalShapeSettings } from "@/lib/stores/decoration-store"
import { DecorationToolbar } from "./DecorationToolbar"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu'

// ═══════════════════════════════════════════════════════
// SVG Path Generators
// ═══════════════════════════════════════════════════════

const ROTATE_CURSOR = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxLjUgMnY2aC02TTIxLjM0IDE1LjU3YTEwIDEwIDAgMSAxLS45Mi0xMC4yNGwzLjA4IDIuNjciLz48L3N2Zz4=') 10 10, crosshair`

function cloudPath(x: number, y: number, w: number, h: number): string {
  // Generate a cloud shape with scalloped edges
  const cx = x + w / 2, cy = y + h / 2
  const rx = w / 2, ry = h / 2
  const bumps = 12
  const points: string[] = []
  for (let i = 0; i < bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2
    const nextAngle = ((i + 1) / bumps) * Math.PI * 2
    const midAngle = (angle + nextAngle) / 2
    const bumpDepth = 0.15 + Math.random() * 0.08 // slight randomness for organic feel

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
      const t1 = j / bumps
      const t2 = (j + 1) / bumps
      const startX = p1.x + dx * t1
      const startY = p1.y + dy * t1
      const endX = p1.x + dx * t2
      const endY = p1.y + dy * t2

      const segmentDist = dist / bumps;
      const radius = segmentDist / 2;
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

function bezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  // Catmull-Rom Spline implementation.
  // This curve is an "interpolating" spline, which means it guarantees
  // passing through EVERY single point provided by the user.
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    // Collect the 4 points needed for the current segment (p0, p1, p2, p3).
    // If we're at the boundaries, simply double-up on the end points.
    const p0 = i === 0 ? points[0] : points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i + 2 < points.length ? points[i + 2] : points[i + 1]

    // Calculate Cubic Bézier control points based on Catmull-Rom tangents
    // Default tension of 0 mathematically simplifies to dividing by 6.
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6

    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }

  return d
}

/**
 * Cubic B-Spline path generator – DaVinci Resolve / Fusion style.
 *
 * Uses a piecewise uniform cubic B-spline with clamped (tripled) endpoints:
 *  • The curve passes exactly through the FIRST and LAST control points.
 *  • Intermediate points act as smooth attractors – the curve flows
 *    towards them without necessarily intersecting them.
 *  • Produces C² continuous curves (curvature-continuous).
 *
 * Each B-spline segment is analytically converted to an exact cubic Bézier
 * `C` command. This guarantees **local stability**: adding a new control
 * point at the end only changes the last ~2 segments; all prior segments
 * produce identical SVG path commands.
 */
function bsplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  if (points.length === 3) {
    // With only 3 points, use a quadratic Bézier through the control point
    return `M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`
  }

  // Build extended control point array with clamped (tripled) endpoints.
  // This pins the curve to pass exactly through the first and last points.
  //   Original:  [P0, P1, P2, ..., Pn]
  //   Extended:  [P0, P0, P0, P1, P2, ..., Pn, Pn, Pn]
  const first = points[0]
  const last = points[points.length - 1]
  const ext = [first, first, ...points, last, last]

  // Each group of 4 consecutive extended points defines one cubic B-spline
  // segment. Convert each analytically to an SVG cubic Bézier `C` command.
  //
  // For uniform cubic B-spline segment with control points [Q0, Q1, Q2, Q3]:
  //   Bézier start = (Q0 + 4·Q1 + Q2) / 6
  //   Bézier CP1   = (2·Q1 + Q2) / 3
  //   Bézier CP2   = (Q1 + 2·Q2) / 3
  //   Bézier end   = (Q1 + 4·Q2 + Q3) / 6
  //
  // Note: end of segment i == start of segment i+1 (C² continuity).

  const numSegs = ext.length - 3

  // Start point (= first point due to clamping)
  const q0 = ext[0], q1 = ext[1], q2 = ext[2]
  const sx = (q0.x + 4 * q1.x + q2.x) / 6
  const sy = (q0.y + 4 * q1.y + q2.y) / 6
  let d = `M ${sx} ${sy}`

  for (let i = 0; i < numSegs; i++) {
    const p0 = ext[i], p1 = ext[i + 1], p2 = ext[i + 2], p3 = ext[i + 3]

    const cp1x = (2 * p1.x + p2.x) / 3
    const cp1y = (2 * p1.y + p2.y) / 3
    const cp2x = (p1.x + 2 * p2.x) / 3
    const cp2y = (p1.y + 2 * p2.y) / 3
    const endX = (p1.x + 4 * p2.x + p3.x) / 6
    const endY = (p1.y + 4 * p2.y + p3.y) / 6

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`
  }

  return d
}

function freehandPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`

  if (points.length === 2) {
    return d + ` L ${points[1].x} ${points[1].y}`
  }

  // Use midpoints as destinations and original points as control points
  // for perfectly smooth continuous curves
  for (let i = 1; i < points.length - 1; i++) {
    const cpX = points[i].x
    const cpY = points[i].y
    const nextX = points[i + 1].x
    const nextY = points[i + 1].y
    const midX = (cpX + nextX) / 2
    const midY = (cpY + nextY) / 2

    d += ` Q ${cpX} ${cpY} ${midX} ${midY}`
  }

  // Connect the very last point
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
  return d
}

function getStrokeDasharray(style: string, customPattern?: string): string {
  if (customPattern) return customPattern
  switch (style) {
    case 'dashed': return '8,6'
    case 'dotted': return '0,8'
    default: return 'none'
  }
}

function snapAngle(startX: number, startY: number, endX: number, endY: number): { x: number; y: number } {
  const dx = endX - startX
  const dy = endY - startY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)
  // Snap to nearest 45°
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  return {
    x: startX + dist * Math.cos(snapped),
    y: startY + dist * Math.sin(snapped)
  }
}

/** Rotate a point (x,y) around a center (cx,cy) by a given angle in degrees */
function rotatePoint(x: number, y: number, cx: number, cy: number, angleDegrees: number): { x: number; y: number } {
  const rad = (angleDegrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = x - cx
  const dy = y - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos
  }
}

// ═══════════════════════════════════════════════════════
// Shape Helpers
// ═══════════════════════════════════════════════════════

const LINE_LIKE_TYPES = ['line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'freehand']
const POINTS_BASED_TYPES = [...LINE_LIKE_TYPES, 'polygon', 'cloud-line']
const EDITABLE_POINTS_TYPES = ['line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line', 'polygon']

function isLineLike(type: string) { return LINE_LIKE_TYPES.includes(type) }
function isPointsBased(type: string) { return POINTS_BASED_TYPES.includes(type) }
function hasEditablePoints(type: string) { return EDITABLE_POINTS_TYPES.includes(type) }

/** Compute the bounding box for any shape (points-based or rect-based) */
function getShapeBounds(shape: DecorationShape): { x: number; y: number; width: number; height: number } {
  if (shape.points && shape.points.length >= 2 && isPointsBased(shape.type)) {
    const xs = shape.points.map(p => p.x)
    const ys = shape.points.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    // Ensure minimum bounding box size for lines
    const PAD = 12
    const w = Math.max(maxX - minX, PAD * 2)
    const h = Math.max(maxY - minY, PAD * 2)
    return {
      x: minX - (w === PAD * 2 ? PAD - (maxX - minX) / 2 : 0),
      y: minY - (h === PAD * 2 ? PAD - (maxY - minY) / 2 : 0),
      width: w,
      height: h
    }
  }
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}

/** Snap a coordinate to the nearest grid increment */
function snapToGrid(val: number, grid: number): number {
  if (grid <= 0) return val
  return Math.round(val / grid) * grid
}

/** Compute snapping nodes for shape endpoints */
function getSnapNodes(shapes: DecorationShape[], excludeId?: string): { x: number, y: number }[] {
  const nodes: { x: number, y: number }[] = []
  shapes.forEach(s => {
    if (s.id === excludeId || !s.visible) return
    const b = getShapeBounds(s)
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2

    // Always include the center point
    const baseNodes = [{ x: cx, y: cy }]

    // Path/line endpoint nodes
    if (s.points && s.points.length >= 2 && isPointsBased(s.type)) {
      baseNodes.push(s.points[0])
      baseNodes.push(s.points[s.points.length - 1])
    } else {
      switch (s.type) {
        case 'triangle':
          baseNodes.push({ x: b.x + b.width / 2, y: b.y }) // top
          baseNodes.push({ x: b.x + b.width, y: b.y + b.height }) // right bottom
          baseNodes.push({ x: b.x, y: b.y + b.height }) // left bottom
          break
        case 'diamond-shape':
          baseNodes.push({ x: b.x + b.width / 2, y: b.y })
          baseNodes.push({ x: b.x + b.width, y: b.y + b.height / 2 })
          baseNodes.push({ x: b.x + b.width / 2, y: b.y + b.height })
          baseNodes.push({ x: b.x, y: b.y + b.height / 2 })
          break
        case 'hexagon':
        case 'pentagon':
          baseNodes.push(...regularPolygon(b.x, b.y, b.width, b.height, s.type === 'hexagon' ? 6 : 5))
          break
        case 'star': {
          const outerR = Math.min(b.width, b.height) / 2
          const innerR = outerR * 0.382
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR
            const angle = (Math.PI / 5) * i - Math.PI / 2
            baseNodes.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
          }
          break
        }
        case 'circle':
        case 'dot':
          // Center is already added, just add the compass points (N, S, E, W)
          baseNodes.push({ x: cx, y: b.y }) // N
          baseNodes.push({ x: cx, y: b.y + b.height }) // S
          baseNodes.push({ x: b.x, y: cy }) // W
          baseNodes.push({ x: b.x + b.width, y: cy }) // E
          break
        default:
          // Rectangles, images, and other shapes: bounding box corners and edge centers
          baseNodes.push(
            { x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x, y: b.y + b.height }, { x: b.x + b.width, y: b.y + b.height },
            { x: cx, y: b.y }, { x: cx, y: b.y + b.height }, { x: b.x, y: cy }, { x: b.x + b.width, y: cy }
          )
          break
      }
    }

    const rotation = s.rotation || 0
    if (Math.abs(rotation) > 0.01) {
      for (const n of baseNodes) {
        nodes.push(rotatePoint(n.x, n.y, cx, cy, rotation))
      }
    } else {
      nodes.push(...baseNodes)
    }
  })
  return nodes
}

// ═══════════════════════════════════════════════════════
// Resize Handle Positions
// ═══════════════════════════════════════════════════════

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const HANDLE_SIZE = 8
const ROTATION_HANDLE_DISTANCE = 50

function getHandlePositions(shape: DecorationShape): { pos: HandlePosition; x: number; y: number; cursor: string }[] {
  const bounds = getShapeBounds(shape)
  const { x, y, width: w, height: h } = bounds
  return [
    { pos: 'nw', x: x, y: y, cursor: 'nw-resize' },
    { pos: 'n', x: x + w / 2, y: y, cursor: 'n-resize' },
    { pos: 'ne', x: x + w, y: y, cursor: 'ne-resize' },
    { pos: 'e', x: x + w, y: y + h / 2, cursor: 'e-resize' },
    { pos: 'se', x: x + w, y: y + h, cursor: 'se-resize' },
    { pos: 's', x: x + w / 2, y: y + h, cursor: 's-resize' },
    { pos: 'sw', x: x, y: y + h, cursor: 'sw-resize' },
    { pos: 'w', x: x, y: y + h / 2, cursor: 'w-resize' },
  ]
}

// ═══════════════════════════════════════════════════════
// Single Shape SVG Element
// ═══════════════════════════════════════════════════════

function getStampContent(type: string): string | null {
  if (type.startsWith('num-')) return type.replace('num-', '')
  switch (type) {
    case 'emoji-star': return '⭐';
    case 'emoji-warning': return '⚠️';
    case 'emoji-heart': return '❤️';
    case 'emoji-thumb': return '👍';
    case 'emoji-fire': return '🔥';
    case 'emoji-idea': return '💡';
    case 'emoji-check': return '✅';
    case 'emoji-cross': return '❌';
    case 'emoji-smile': return '😊';
    case 'emoji-sad': return '😢';
    case 'emoji-rocket': return '🚀';
    case 'emoji-target': return '🎯';
    case 'emoji-laugh': return '😂';
    case 'emoji-clap': return '👏';
    case 'emoji-eyes': return '👀';
    case 'emoji-sparkles': return '✨';
    case 'emoji-party': return '🎉';
    case 'emoji-brain': return '🧠';
    case 'emoji-muscle': return '💪';
    case 'emoji-crown': return '👑';
    case 'emoji-diamond': return '💎';
    case 'emoji-medal': return '🏅';
    case 'emoji-clock': return '⏰';
    case 'emoji-lock': return '🔒';
    case 'emoji-umbrella': return '☂️';
    case 'exclamation': return '❗';
    case 'question': return '❓';
    case 'pushpin': return '📌';
    case 'bullseye': return '◎';
  }
  return null;
}

const ShapeSVG = React.memo(function ShapeSVGComponent({ shape }: { shape: DecorationShape }) {
  const { x, y, width: w, height: h, fillColor, fillOpacity, strokeColor, strokeWidth, strokeStyle, rotation, type } = shape
  const fill = isLineLike(type) ? 'none' : fillColor
  const opacity = fillOpacity / 100
  const dash = getStrokeDasharray(strokeStyle, shape.strokeDashPattern)
  const bounds = getShapeBounds(shape)
  const transform = rotation ? `rotate(${rotation} ${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2})` : undefined
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (type === 'textbox-auto' && shape.autoSize && contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const el = entry.target as HTMLDivElement
          const newW = el.offsetWidth + 8
          const newH = el.offsetHeight + 8
          const currentShape = useDecorationStore.getState().shapes.find(s => s.id === shape.id)
          if (currentShape && (Math.abs(currentShape.width - newW) > 1 || Math.abs(currentShape.height - newH) > 1)) {
            useDecorationStore.getState().updateShape(shape.id, { width: newW, height: newH })
          }
        }
      })
      observer.observe(contentRef.current)
      return () => observer.disconnect()
    }
  }, [shape.id, type, shape.autoSize])

  const commonProps = {
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: dash === 'none' ? undefined : dash,
    transform,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  const stampText = getStampContent(type)
  if (stampText) {
    const isNum = type.startsWith('num-')
    return (
      <g transform={transform}>
        <rect x={x} y={y} width={w} height={h} fill="transparent" />
        <text
          x={x + w / 2}
          y={y + h / 2 + Math.min(w, h) * 0.05}
          fontSize={Math.min(w, h) * 0.8}
          fontFamily="sans-serif"
          fontWeight={isNum ? "bold" : "normal"}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isNum ? (fillColor !== 'transparent' ? fillColor : '#3b82f6') : undefined}
          fillOpacity={isNum ? opacity : undefined}
          stroke={isNum ? strokeColor : undefined}
          strokeWidth={isNum ? strokeWidth : undefined}
          paintOrder={isNum && strokeWidth > 0 ? "stroke" : undefined}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {stampText}
        </text>
      </g>
    )
  }

  switch (type) {
    case 'rectangle':
      return <rect x={x} y={y} width={w} height={h} fill={fill} fillOpacity={opacity} rx={2} {...commonProps} />

    case 'circle':
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'triangle':
      return <polygon points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'star': {
      const cx = x + w / 2; const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2; const innerR = outerR * (0.382);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        pts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
      }
      return <polygon points={pts.join(' ')} fill={fill} fillOpacity={opacity} {...commonProps} />
    }

    case 'info':
      return (
        <g {...commonProps}>
          <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2 * 0.9} fill={fill} fillOpacity={opacity} />
          <line x1={x + w / 2} y1={y + h * 0.45} x2={x + w / 2} y2={y + h * 0.75} strokeLinecap="round" />
          <line x1={x + w / 2} y1={y + h * 0.25} x2={x + w / 2} y2={y + h * 0.25} strokeLinecap="round" strokeWidth={Math.max(2, strokeWidth * 1.5)} />
        </g>
      )

    case 'checkmark':
      return <path d={`M ${x + w * 0.2} ${y + h * 0.5} L ${x + w * 0.4} ${y + h * 0.75} L ${x + w * 0.8} ${y + h * 0.25}`} fill="none" {...commonProps} />

    case 'crossmark':
      return (
        <g>
          <line x1={x + w * 0.2} y1={y + h * 0.2} x2={x + w * 0.8} y2={y + h * 0.8} {...commonProps} />
          <line x1={x + w * 0.8} y1={y + h * 0.2} x2={x + w * 0.2} y2={y + h * 0.8} {...commonProps} />
        </g>
      )

    case 'dot':
      return <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2 * 0.8} fill={strokeColor} />

    case 'line': {
      const pts = shape.points
      if (pts && pts.length >= 2) {
        const [p1, p2] = pts
        return (
          <g transform={transform}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={Math.max(strokeWidth, 16)} />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...commonProps} transform={undefined} />
          </g>
        )
      }
      return <line x1={x} y1={y} x2={x + w} y2={y + h} {...commonProps} />
    }

    case 'arrow':
    case 'double-arrow': {
      const pts = shape.points
      if (pts && pts.length >= 2) {
        const [p1, p2] = pts
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const angle = Math.atan2(dy, dx)
        const arrowSize = Math.max(10, Math.min(Math.sqrt(dx * dx + dy * dy) * 0.12, 18))
        return (
          <g transform={transform}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={Math.max(strokeWidth, 16)} />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} {...commonProps} transform={undefined} />
            <line x1={p2.x - arrowSize * Math.cos(angle - 0.4)} y1={p2.y - arrowSize * Math.sin(angle - 0.4)} x2={p2.x} y2={p2.y} {...commonProps} transform={undefined} strokeDasharray="none" />
            <line x1={p2.x - arrowSize * Math.cos(angle + 0.4)} y1={p2.y - arrowSize * Math.sin(angle + 0.4)} x2={p2.x} y2={p2.y} {...commonProps} transform={undefined} strokeDasharray="none" />
            {type === 'double-arrow' && (
              <>
                <line x1={p1.x + arrowSize * Math.cos(angle - 0.4)} y1={p1.y + arrowSize * Math.sin(angle - 0.4)} x2={p1.x} y2={p1.y} {...commonProps} transform={undefined} strokeDasharray="none" />
                <line x1={p1.x + arrowSize * Math.cos(angle + 0.4)} y1={p1.y + arrowSize * Math.sin(angle + 0.4)} x2={p1.x} y2={p1.y} {...commonProps} transform={undefined} strokeDasharray="none" />
              </>
            )}
          </g>
        )
      }
      return <line x1={x} y1={y} x2={x + w} y2={y + h} {...commonProps} />
    }

    case 'cloud':
      return <path d={cloudPath(x, y, w, h)} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'polygon':
      if (shape.points && shape.points.length >= 3) {
        return <path d={polygonPath(shape.points)} fill={fill} fillOpacity={opacity} {...commonProps} />
      }
      return <path d={polygonPath(regularPolygon(x, y, w, h, 6))} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'connected-lines':
      if (shape.points && shape.points.length >= 2) {
        return <path d={connectedLinesPath(shape.points)} fill="none" {...commonProps} />
      }
      return <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} {...commonProps} />

    case 'bezier-line':
      if (shape.points && shape.points.length >= 2) {
        return <path d={bezierPath(shape.points)} fill="none" {...commonProps} />
      }
      return <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} {...commonProps} />

    case 'bspline-curve':
      if (shape.points && shape.points.length >= 2) {
        return <path d={bsplinePath(shape.points)} fill="none" {...commonProps} />
      }
      return <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} {...commonProps} />

    case 'cloud-line':
      if (shape.points && shape.points.length >= 2) {
        return <path d={cloudLinePath(shape.points)} fill={fill} fillOpacity={opacity} {...commonProps} />
      }
      return <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} {...commonProps} />

    case 'freehand':
      if (shape.points && shape.points.length >= 2) {
        return <path d={freehandPath(shape.points)} fill="none" {...commonProps} />
      }
      return null

    case 'text-callout': {
      const tailH = Math.min(20, h * 0.3)
      const boxH = h - tailH
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={w} height={boxH} fill={fill} fillOpacity={opacity} rx={6} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dash === 'none' ? undefined : dash} />
          {/* Tail */}
          <polygon
            points={`${x + w * 0.3},${y + boxH} ${x + w * 0.5},${y + h} ${x + w * 0.5},${y + boxH}`}
            fill={fill}
            fillOpacity={opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Text */}
          {shape.text && (
            <foreignObject x={x + 6} y={y + 4} width={w - 12} height={boxH - 8}>
              <div style={{ fontSize: '12px', color: strokeColor, wordBreak: 'break-word', lineHeight: 1.3 }}>
                {shape.text}
              </div>
            </foreignObject>
          )}
        </g>
      )
    }

    case 'textbox':
    case 'textbox-auto': {
      const isAutoSized = shape.autoSize && type === 'textbox-auto'
      const fSize = type === 'textbox-auto' && !shape.autoSize
        ? Math.max(6, Math.min(w, h) * 0.18)
        : (shape.fontSize || 14)
      const hasHtml = shape.text ? /<[a-z][\s\S]*>/i.test(shape.text) : false
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={w} height={h} fill={fill} fillOpacity={opacity} rx={4} {...commonProps} transform={undefined} />
          {shape.text && (
            <foreignObject
              x={x + 4}
              y={y + 4}
              width={isAutoSized ? Math.max(2000, w) : Math.max(0, w - 8)}
              height={isAutoSized ? Math.max(2000, h) : Math.max(0, h - 8)}
              style={{ overflow: isAutoSized ? 'visible' : 'hidden' }}
            >
              <style>{`
                .deco-textbox-content p, .deco-textbox-content div { margin: 0; padding: 0; }
                .deco-textbox-content ul { list-style-type: disc; padding-left: 16px; margin: 2px 0; }
                .deco-textbox-content ol { list-style-type: decimal; padding-left: 16px; margin: 2px 0; }
                .deco-textbox-content li { margin-bottom: 1px; }
              `}</style>
              <div
                ref={contentRef}
                className="deco-textbox-content"
                style={{
                  width: isAutoSized ? 'max-content' : '100%',
                  height: isAutoSized ? 'auto' : (type === 'textbox' ? '100%' : 'auto'),
                  display: isAutoSized ? 'inline-block' : 'block',
                  fontSize: `${fSize}px`,
                  fontFamily: shape.fontFamily || 'Arial',
                  fontWeight: shape.fontWeight || 'normal',
                  fontStyle: shape.fontStyle || 'normal',
                  textDecoration: shape.textDecoration || 'none',
                  textAlign: (shape.textAlign || 'left') as any,
                  color: shape.textColor || strokeColor,
                  lineHeight: shape.lineHeight ? `${shape.lineHeight}` : '1.4',
                  wordBreak: 'break-word' as const,
                  whiteSpace: 'pre-wrap',
                  userSelect: 'none' as const,
                  pointerEvents: 'none' as const,
                }}
                {...(hasHtml ? { dangerouslySetInnerHTML: { __html: shape.text } } : {})}
              >
                {hasHtml ? undefined : shape.text}
              </div>
            </foreignObject>
          )}
        </g>
      )
    }

    case 'deco-image': {
      const pmap: Record<string, string> = { fill: 'none', cover: 'xMidYMid slice', contain: 'xMidYMid meet' }
      const par = shape.imageFit ? pmap[shape.imageFit] : 'xMidYMid slice'
      const clipId = `clip-image-${shape.id}`
      const rx = shape.borderRadius || 0
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={w} height={h} fill={fill} fillOpacity={opacity} rx={rx} {...commonProps} transform={undefined} />
          {shape.imageUrl && (
            <>
              {rx > 0 && (
                <defs>
                  <clipPath id={clipId}>
                    <rect x={x} y={y} width={w} height={h} rx={rx} />
                  </clipPath>
                </defs>
              )}
              <image
                x={x} y={y} width={w} height={h}
                href={shape.imageUrl}
                preserveAspectRatio={par}
                clipPath={rx > 0 ? `url(#${clipId})` : undefined}
                style={{ pointerEvents: 'none' }}
              />
            </>
          )}
        </g>
      )
    }

    case 'deco-svg': {
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={w} height={h} fill="transparent" stroke="none" />
          {shape.svgContent && (
            <foreignObject x={x} y={y} width={w} height={h}>
              <style>{`
                .deco-svg-container-${shape.id} svg {
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                }
              `}</style>
              <div
                className={`deco-svg-container-${shape.id}`}
                style={{
                  width: '100%', height: '100%',
                  pointerEvents: 'none' as const,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: shape.svgContent }}
              />
            </foreignObject>
          )}
        </g>
      )
    }

    case 'hexagon':
      return <path d={polygonPath(regularPolygon(x, y, w, h, 6))} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'pentagon':
      return <path d={polygonPath(regularPolygon(x, y, w, h, 5))} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'diamond-shape':
      return <polygon points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} fill={fill} fillOpacity={opacity} {...commonProps} />

    case 'heart': {
      const hcx = x + w / 2; const hcy = y + h / 2;
      const hpath = `M ${hcx},${y + h * 0.85} ` +
        `C ${x},${y + h * 0.55} ${x},${y + h * 0.1} ${hcx},${y + h * 0.3} ` +
        `C ${x + w},${y + h * 0.1} ${x + w},${y + h * 0.55} ${hcx},${y + h * 0.85} Z`;
      return <path d={hpath} fill={fill} fillOpacity={opacity} {...commonProps} />
    }

    default:
      return <rect x={x} y={y} width={w} height={h} fill={fill} fillOpacity={opacity} {...commonProps} />
  }
})

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

// ═══════════════════════════════════════════════════════
// Drawing Preview
// ═══════════════════════════════════════════════════════

function DrawingPreview({ drawing, settings }: { drawing: DrawingState, settings: GlobalShapeSettings }) {
  const { mode, startX, startY, currentX, currentY, points, shiftKey } = drawing

  let endX = currentX, endY = currentY
  if (shiftKey && (mode === 'line' || mode === 'arrow' || mode === 'double-arrow' || mode === 'connected-lines' || mode === 'bezier-line' || mode === 'bspline-curve' || mode === 'cloud-line')) {
    const snapped = snapAngle(startX, startY, currentX, currentY)
    endX = snapped.x
    endY = snapped.y
  }

  const isLineMode = ['freehand', 'line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line'].includes(mode)

  const previewProps = {
    stroke: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    strokeDasharray: getStrokeDasharray(settings.strokeStyle, settings.strokeDashPattern) === 'none' ? undefined : getStrokeDasharray(settings.strokeStyle, settings.strokeDashPattern),
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: isLineMode ? 'none' : settings.fillColor,
    fillOpacity: isLineMode ? undefined : settings.fillOpacity / 100,
    pointerEvents: 'none' as const,
  }

  if (shiftKey && (['rectangle', 'circle', 'triangle', 'star', 'checkmark', 'crossmark', 'dot', 'hexagon', 'heart', 'pentagon', 'diamond-shape'].includes(mode) || mode.startsWith('num-') || mode.startsWith('emoji-'))) {
    const dx = endX - startX
    const dy = endY - startY
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    endX = startX + (Math.sign(dx) || 1) * size
    endY = startY + (Math.sign(dy) || 1) * size
  }

  // Compute bounding box for rect-based shapes
  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const w = Math.abs(endX - startX)
  const h = Math.abs(endY - startY)

  // --- Shape-specific live previews ---
  switch (mode) {
    case 'circle':
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...previewProps} />

    case 'triangle':
      return <polygon points={`${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`} {...previewProps} />

    case 'star': {
      const cx = x + w / 2; const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2; const innerR = outerR * 0.382;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        pts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
      }
      return <polygon points={pts.join(' ')} {...previewProps} />
    }

    case 'cloud':
      return <path d={cloudPath(x, y, w, h)} {...previewProps} />

    case 'info':
      return (
        <g {...previewProps}>
          <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2 * 0.9} />
          <line x1={x + w / 2} y1={y + h * 0.45} x2={x + w / 2} y2={y + h * 0.75} strokeLinecap="round" />
          <line x1={x + w / 2} y1={y + h * 0.25} x2={x + w / 2} y2={y + h * 0.25} strokeLinecap="round" strokeWidth={Math.max(2, settings.strokeWidth * 1.5)} />
        </g>
      )

    case 'checkmark':
      return <path d={`M ${x + w * 0.2} ${y + h * 0.5} L ${x + w * 0.4} ${y + h * 0.75} L ${x + w * 0.8} ${y + h * 0.25}`} {...previewProps} fill="none" />

    case 'crossmark':
      return (
        <g {...previewProps} fill="none">
          <line x1={x + w * 0.2} y1={y + h * 0.2} x2={x + w * 0.8} y2={y + h * 0.8} />
          <line x1={x + w * 0.8} y1={y + h * 0.2} x2={x + w * 0.2} y2={y + h * 0.8} />
        </g>
      )

    case 'dot':
      return <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2 * 0.8} {...previewProps} />

    case 'text-callout': {
      const tailH = Math.min(20, h * 0.3)
      const boxH = h - tailH
      return (
        <g {...previewProps}>
          <rect x={x} y={y} width={w} height={boxH} rx={6} />
          <polygon points={`${x + w * 0.3},${y + boxH} ${x + w * 0.5},${y + h} ${x + w * 0.5},${y + boxH}`} />
        </g>
      )
    }

    case 'hexagon':
      return <path d={polygonPath(regularPolygon(x, y, w, h, 6))} {...previewProps} />

    case 'pentagon':
      return <path d={polygonPath(regularPolygon(x, y, w, h, 5))} {...previewProps} />

    case 'diamond-shape':
      return <polygon points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} {...previewProps} />

    case 'heart': {
      const hcx = x + w / 2;
      const hpath = `M ${hcx},${y + h * 0.85} C ${x},${y + h * 0.55} ${x},${y + h * 0.1} ${hcx},${y + h * 0.3} C ${x + w},${y + h * 0.1} ${x + w},${y + h * 0.55} ${hcx},${y + h * 0.85} Z`;
      return <path d={hpath} {...previewProps} />
    }

    case 'rectangle':
      return <rect x={x} y={y} width={w} height={h} {...previewProps} />

    case 'textbox':
      return (
        <g pointerEvents="none">
          <rect x={x} y={y} width={w} height={h} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,4" fill="rgba(59, 130, 246, 0.08)" rx={4} />
          <rect x={currentX + 16} y={currentY - 12} width={74} height={24} fill="#1e293b" rx={4} />
          <text x={currentX + 53} y={currentY + 4} fontSize={12} fontFamily="Arial" fill="white" textAnchor="middle" stroke="none">{Math.round(w)} x {Math.round(h)}</text>
        </g>
      )

    case 'textbox-auto': {
      const fontSize = Math.max(14, h)
      return (
        <g pointerEvents="none">
          <text x={startX + 4} y={y + fontSize * 1.05 + 4} fontSize={fontSize} fontFamily="Arial" fill="#1e293b" opacity={0.5} stroke="none">A</text>
          <rect x={currentX + 16} y={currentY - 12} width={54} height={24} fill="#1e293b" rx={4} />
          <text x={currentX + 43} y={currentY + 4} fontSize={12} fontFamily="Arial" fill="white" textAnchor="middle" stroke="none">{Math.round(fontSize)}px</text>
        </g>
      )
    }

    case 'deco-image':
    case 'deco-svg':
      return <rect x={x} y={y} width={w} height={h} {...previewProps} rx={4} />

    case 'line':
      return <line x1={startX} y1={startY} x2={endX} y2={endY} {...previewProps} fill="none" />

    case 'arrow':
    case 'double-arrow': {
      const arrowSize = 10
      const angle = Math.atan2(endY - startY, endX - startX)
      return (
        <g {...previewProps} fill="none">
          <line x1={startX} y1={startY} x2={endX} y2={endY} />
          <line x1={endX - arrowSize * Math.cos(angle - 0.4)} y1={endY - arrowSize * Math.sin(angle - 0.4)} x2={endX} y2={endY} strokeDasharray="none" />
          <line x1={endX - arrowSize * Math.cos(angle + 0.4)} y1={endY - arrowSize * Math.sin(angle + 0.4)} x2={endX} y2={endY} strokeDasharray="none" />
          {mode === 'double-arrow' && (
            <>
              <line x1={startX + arrowSize * Math.cos(angle - 0.4)} y1={startY + arrowSize * Math.sin(angle - 0.4)} x2={startX} y2={startY} strokeDasharray="none" />
              <line x1={startX + arrowSize * Math.cos(angle + 0.4)} y1={startY + arrowSize * Math.sin(angle + 0.4)} x2={startX} y2={startY} strokeDasharray="none" />
            </>
          )}
        </g>
      )
    }

    case 'freehand':
      if (points.length < 2) return null
      return <path d={freehandPath(points)} {...previewProps} fill="none" />

    case 'polygon':
    case 'connected-lines':
    case 'bezier-line':
    case 'bspline-curve':
    case 'cloud-line':
      if (points.length === 0) return null
      // Only append cursor position if it has moved away from the last clicked point.
      // Right after a click the cursor is at the same spot, and appending it would
      // create a duplicate control point that shifts B-spline / bezier curvature.
      const lastPt = points[points.length - 1]
      const cursorIsDuplicate = lastPt && Math.abs(endX - lastPt.x) < 2 && Math.abs(endY - lastPt.y) < 2
      const allPts = cursorIsDuplicate ? points : [...points, { x: endX, y: endY }]
      if (mode === 'cloud-line') return <path d={cloudLinePath(allPts)} {...previewProps} />
      if (mode === 'bezier-line') return <path d={bezierPath(allPts)} {...previewProps} />
      if (mode === 'bspline-curve') return <path d={bsplinePath(allPts)} {...previewProps} />
      return <path d={connectedLinesPath(allPts)} {...previewProps} />

    default: {
      // Numbers and emojis: show the actual stamp text as preview
      const stampText = getStampContent(mode)
      if (stampText) {
        return (
          <g pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} fill="transparent" stroke="none" />
            <text
              x={x + w / 2}
              y={y + h / 2 + Math.min(w, h) * 0.05}
              fontSize={Math.min(w, h) * 0.8}
              fontFamily="sans-serif"
              fontWeight={mode.startsWith('num-') ? 'bold' : 'normal'}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={mode.startsWith('num-') ? '#3b82f6' : undefined}
              fillOpacity={0.6}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {stampText}
            </text>
          </g>
        )
      }
      return null
    }
  }
}

// ═══════════════════════════════════════════════════════
// Main Renderer Component
// ═══════════════════════════════════════════════════════

interface DecorationShapeRendererProps {
  containerWidth: number
  containerHeight: number
  panMode?: boolean
  gridSize?: number
}

export function DecorationShapeRenderer({ containerWidth, containerHeight, panMode, gridSize = 0 }: DecorationShapeRendererProps) {
  const {
    shapes, selectedShapeId, selectedShapeIds, drawingMode, globalShapeSettings,
    setSelectedShapeId, setSelectedShapeIds, toggleShapeSelection, clearMultiSelect,
    setDrawingMode, addShape, updateShape
  } = useDecorationStore()

  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null)
  const [drawingInProgress, setDrawingInProgress] = useState<DrawingState | null>(null)
  const [marqueeState, setMarqueeState] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [snapGuides, setSnapGuides] = useState<{ x: number | null, y: number | null }>({ x: null, y: null })
  const [nodeSnapGuide, setNodeSnapGuide] = useState<{ x: number, y: number } | null>(null)
  const editRef = useRef<HTMLDivElement>(null)
  const lastMouseDownTargetRef = useRef<EventTarget | null>(null)
  const ignoreNextClickRef = useRef<boolean>(false)
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize' | 'rotate' | 'endpoint'
    shapeId: string
    startX: number
    startY: number
    origShape: DecorationShape
    origShapes?: DecorationShape[]
    currentShape?: DecorationShape
    currentShapes?: Record<string, DecorationShape>
    handle?: HandlePosition
    endpointIndex?: number  // 0 = start, 1 = end (for line/arrow endpoint drag)
  } | null>(null)

  // ── Coordinate helpers ─────────────────────────────

  const getSVGPoint = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? (e as TouchEvent).changedTouches[0]?.clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY ?? (e as TouchEvent).changedTouches[0]?.clientY : (e as MouseEvent).clientY

    // Use SVG's screen coordinate transform matrix to properly convert
    // screen coords → SVG-local coords. This automatically handles any
    // CSS transforms (scale, translate) applied by parent containers.
    const ctm = svg.getScreenCTM()
    if (ctm) {
      const inverseCTM = ctm.inverse()
      return {
        x: inverseCTM.a * clientX + inverseCTM.c * clientY + inverseCTM.e,
        y: inverseCTM.b * clientX + inverseCTM.d * clientY + inverseCTM.f
      }
    }

    // Fallback: manual calculation using bounding rect
    const rect = svg.getBoundingClientRect()
    const scaleX = rect.width > 0 ? containerWidth / rect.width : 1
    const scaleY = rect.height > 0 ? containerHeight / rect.height : 1
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }, [containerWidth, containerHeight])

  // ── Drawing handlers ──────────────────────────────

  const handleCanvasPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (panMode || !drawingMode) return
    const pt = getSVGPoint(e as any)
    if (!pt) return

    // ── Marquee select mode: start selection rectangle ──
    if (drawingMode === 'marquee-select') {
      e.preventDefault()
      e.stopPropagation()
      setMarqueeState({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y })
      return
    }

    e.preventDefault()
    e.stopPropagation()

    let startX = pt.x
    let startY = pt.y
    let didNodeSnap = false

    if (!e.altKey && drawingMode !== 'freehand' && drawingMode !== 'marquee-select') {
      const snapNodes = getSnapNodes(shapes)
      let bestDist = 8
      for (const node of snapNodes) {
        if (Math.sqrt(Math.pow(startX - node.x, 2) + Math.pow(startY - node.y, 2)) < bestDist) {
          bestDist = Math.sqrt(Math.pow(startX - node.x, 2) + Math.pow(startY - node.y, 2))
          startX = node.x
          startY = node.y
          didNodeSnap = true
        }
      }
    }

    // Grid snap (if no node snap happened)
    if (!didNodeSnap && gridSize > 0) {
      startX = snapToGrid(startX, gridSize)
      startY = snapToGrid(startY, gridSize)
    }

    const shiftKey = 'shiftKey' in e ? (e as React.MouseEvent).shiftKey : false

    if (drawingMode === 'polygon' || drawingMode === 'connected-lines' || drawingMode === 'bezier-line' || drawingMode === 'bspline-curve' || drawingMode === 'cloud-line') {
      // Multi-point mode: add point on each click
      const current = drawingInProgress
      if (current && current.mode === drawingMode) {
        setDrawingInProgress({
          ...current,
          points: [...current.points, { x: startX, y: startY }],
          currentX: startX,
          currentY: startY,
          shiftKey
        })
      } else {
        setDrawingInProgress({
          mode: drawingMode,
          startX: startX, startY: startY,
          currentX: startX, currentY: startY,
          points: [{ x: startX, y: startY }],
          shiftKey
        })
      }
      return
    }

    // Single-gesture shapes
    setDrawingInProgress({
      mode: drawingMode,
      startX: startX, startY: startY,
      currentX: startX, currentY: startY,
      points: [{ x: startX, y: startY }],
      shiftKey
    })
  }, [drawingMode, panMode, getSVGPoint, drawingInProgress, setDrawingInProgress, addShape, shapes.length, setDrawingMode, setSelectedShapeId, setEditingShapeId])

  const handleCanvasPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // ── Marquee drag update ──
    if (marqueeState) {
      const pt = getSVGPoint(e as any)
      if (pt) {
        setMarqueeState(prev => prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null)
      }
      return
    }

    const isSnappableMode = (mode: string | null) => mode && mode !== 'freehand' && mode !== 'marquee-select'
    const hasSnappableMode = isSnappableMode(drawingMode)

    if (!drawingInProgress && !dragState && !hasSnappableMode) return
    const pt = getSVGPoint(e as any)
    if (!pt) return

    // Node Snapping for endpoints or drawing lines — also fires when
    // a snappable drawing tool is selected but drawing hasn't started yet,
    // so the user sees snap indicators before their first click.
    let snappedNode = false
    if (!e.altKey && (
      (drawingInProgress && isSnappableMode(drawingInProgress.mode)) ||
      (dragState && (dragState.type === 'endpoint' || dragState.type === 'resize')) ||
      (!drawingInProgress && hasSnappableMode)
    )) {
      const excludeId = dragState ? dragState.shapeId : undefined
      const snapNodes = getSnapNodes(shapes, excludeId)
      let bestDist = 8 // Snap threshold
      let targetX = pt.x
      let targetY = pt.y

      for (const node of snapNodes) {
        const dist = Math.sqrt(Math.pow(pt.x - node.x, 2) + Math.pow(pt.y - node.y, 2))
        if (dist < bestDist) {
          bestDist = dist
          targetX = node.x
          targetY = node.y
          snappedNode = true
        }
      }

      if (snappedNode) {
        pt.x = targetX
        pt.y = targetY
        setNodeSnapGuide({ x: targetX, y: targetY })
      } else {
        setNodeSnapGuide(null)
        // Grid snap fallback for line drawing
        if (gridSize > 0 && drawingInProgress) {
          pt.x = snapToGrid(pt.x, gridSize)
          pt.y = snapToGrid(pt.y, gridSize)
        }
      }
    } else {
      setNodeSnapGuide(null)
      // Grid snap for non-line drawing modes
      if (gridSize > 0 && drawingInProgress) {
        pt.x = snapToGrid(pt.x, gridSize)
        pt.y = snapToGrid(pt.y, gridSize)
      }
    }

    const shiftKey = 'shiftKey' in e ? (e as React.MouseEvent).shiftKey : false

    // Optionally record cursor position for some features like textbox
    setCursorPos(pt)

    // Handle drag/resize/rotate/endpoint
    if (dragState) {
      e.preventDefault()
      e.stopPropagation()
      const dx = pt.x - dragState.startX
      const dy = pt.y - dragState.startY
      const orig = dragState.origShape

      const rotation = orig.rotation || 0
      let localDx = dx
      let localDy = dy

      // If shape is rotated, transform mouse delta into shape's local coordinate space
      if (Math.abs(rotation) > 0.01 && (dragState.type === 'resize' || dragState.type === 'endpoint')) {
        const oBounds = getShapeBounds(orig)
        const cx = oBounds.x + oBounds.width / 2
        const cy = oBounds.y + oBounds.height / 2
        // Rotate current point AND start point BACKWARDS around center to get local coordinates
        const localPt = rotatePoint(pt.x, pt.y, cx, cy, -rotation)
        const localStart = rotatePoint(dragState.startX, dragState.startY, cx, cy, -rotation)
        localDx = localPt.x - localStart.x
        localDy = localPt.y - localStart.y
      }

      if (dragState.type === 'move') {
        let finalDx = dx
        let finalDy = dy
        let snapX: number | null = null
        let snapY: number | null = null

        // Smart snapping (disable if altKey/option is pressed)
        if (!e.altKey) {
          const SNAP_THRESHOLD = 5
          const draggedBounds = getShapeBounds(orig)
          const dCenter = {
            x: draggedBounds.x + draggedBounds.width / 2 + dx,
            y: draggedBounds.y + draggedBounds.height / 2 + dy
          }

          const targetXs = [containerWidth / 2]; const targetYs = [containerHeight / 2]

          shapes.forEach(s => {
            if (s.id === dragState.shapeId || !s.visible) return
            const b = getShapeBounds(s)
            targetXs.push(b.x, b.x + b.width / 2, b.x + b.width)
            targetYs.push(b.y, b.y + b.height / 2, b.y + b.height)
          })

          const candidateXs = [draggedBounds.x + dx, dCenter.x, draggedBounds.x + draggedBounds.width + dx]
          const candidateYs = [draggedBounds.y + dy, dCenter.y, draggedBounds.y + draggedBounds.height + dy]

          let bestXMatch = { dist: SNAP_THRESHOLD + 1, diff: 0, target: 0 }
          for (const cx of candidateXs) {
            for (const tx of targetXs) {
              const dist = Math.abs(cx - tx)
              if (dist < bestXMatch.dist) bestXMatch = { dist, diff: tx - cx, target: tx }
            }
          }
          if (bestXMatch.dist <= SNAP_THRESHOLD) {
            finalDx += bestXMatch.diff; snapX = bestXMatch.target
          }

          let bestYMatch = { dist: SNAP_THRESHOLD + 1, diff: 0, target: 0 }
          for (const cy of candidateYs) {
            for (const ty of targetYs) {
              const dist = Math.abs(cy - ty)
              if (dist < bestYMatch.dist) bestYMatch = { dist, diff: ty - cy, target: ty }
            }
          }
          if (bestYMatch.dist <= SNAP_THRESHOLD) {
            finalDy += bestYMatch.diff; snapY = bestYMatch.target
          }
        }

        // Grid snap fallback for move (only if no smart guide matched)
        if (gridSize > 0 && snapX === null && snapY === null) {
          const draggedBounds = getShapeBounds(orig)
          const newX = draggedBounds.x + finalDx
          const newY = draggedBounds.y + finalDy
          const gridX = snapToGrid(newX, gridSize)
          const gridY = snapToGrid(newY, gridSize)
          finalDx += (gridX - newX)
          finalDy += (gridY - newY)
        }

        // Clamp to container boundaries (like Zones) so shapes don't go off-screen
        let finalClampedDx = finalDx
        let finalClampedDy = finalDy
        if (dragState.origShapes) {
          const draggedShapes = dragState.origShapes
          const minX = Math.min(...draggedShapes.map(s => getShapeBounds(s).x))
          const minY = Math.min(...draggedShapes.map(s => getShapeBounds(s).y))
          const maxR = Math.max(...draggedShapes.map(s => { const b = getShapeBounds(s); return b.x + b.width }))
          const maxB = Math.max(...draggedShapes.map(s => { const b = getShapeBounds(s); return b.y + b.height }))
          const groupWidth = maxR - minX
          const groupHeight = maxB - minY
          let clampedX = minX + finalDx
          let clampedY = minY + finalDy
          clampedX = Math.max(0, Math.min(clampedX, containerWidth - groupWidth))
          clampedY = Math.max(0, Math.min(clampedY, containerHeight - groupHeight))
          finalClampedDx = clampedX - minX
          finalClampedDy = clampedY - minY
        } else {
          const draggedBounds = getShapeBounds(orig)
          let clampedX = draggedBounds.x + finalDx
          let clampedY = draggedBounds.y + finalDy
          clampedX = Math.max(0, Math.min(clampedX, containerWidth - draggedBounds.width))
          clampedY = Math.max(0, Math.min(clampedY, containerHeight - draggedBounds.height))
          finalClampedDx = clampedX - draggedBounds.x
          finalClampedDy = clampedY - draggedBounds.y
        }

        setSnapGuides({ x: snapX, y: snapY })

        // Apply
        const draggingShapes = dragState.origShapes || [orig]
        const newCurrentShapes: Record<string, DecorationShape> = {}
        let mainMoved: DecorationShape | undefined

        draggingShapes.forEach(os => {
          let moved: DecorationShape
          if (os.points && os.points.length > 0) {
            const movedPoints = os.points.map(p => ({ x: p.x + finalClampedDx, y: p.y + finalClampedDy }))
            moved = { ...os, x: os.x + finalClampedDx, y: os.y + finalClampedDy, points: movedPoints }
          } else {
            moved = { ...os, x: os.x + finalClampedDx, y: os.y + finalClampedDy }
          }
          newCurrentShapes[os.id] = moved
          if (os.id === dragState.shapeId) mainMoved = moved
        })

        setDragState(p => p ? { ...p, currentShapes: newCurrentShapes, currentShape: mainMoved } : null)
      } else if (dragState.type === 'endpoint' && dragState.endpointIndex !== undefined) {
        // Drag individual endpoint of line/arrow
        const newPoints = [...(orig.points || [])]
        const idx = dragState.endpointIndex
        if (newPoints[idx]) {
          const rotation = orig.rotation || 0
          let localPt = { x: pt.x, y: pt.y }
          if (Math.abs(rotation) > 0.01) {
            const oBounds = getShapeBounds(orig)
            const cx = oBounds.x + oBounds.width / 2
            const cy = oBounds.y + oBounds.height / 2
            localPt = rotatePoint(pt.x, pt.y, cx, cy, -rotation)
          }

          let finalX = localPt.x
          let finalY = localPt.y

          // Handle shift-key constraint if needed (straight horizontal/vertical)
          const shiftKey = 'shiftKey' in e ? (e as React.MouseEvent).shiftKey : false
          if (shiftKey && orig.points && orig.points.length >= 2) {
            const otherIdx = idx === 0 ? orig.points.length - 1 : (idx === orig.points.length - 1 ? 0 : idx - 1)
            const otherPt = orig.points[otherIdx]
            const snapped = snapAngle(otherPt.x, otherPt.y, finalX, finalY)
            finalX = snapped.x
            finalY = snapped.y
          }

          newPoints[idx] = { x: finalX, y: finalY }

          // Recompute bounding box from points
          const xs = newPoints.map(p => p.x)
          const ys = newPoints.map(p => p.y)
          setDragState(p => p ? {
            ...p, currentShape: {
              ...p.origShape,
              points: newPoints,
              x: Math.min(...xs), y: Math.min(...ys),
              width: Math.max(Math.abs(Math.max(...xs) - Math.min(...xs)), 1),
              height: Math.max(Math.abs(Math.max(...ys) - Math.min(...ys)), 1)
            }
          } : null)
        }
      } else if (dragState.type === 'rotate') {
        // Rotation: compute angle from center of shape to current mouse
        const bounds = getShapeBounds(orig)
        const cx = bounds.x + bounds.width / 2
        const cy = bounds.y + bounds.height / 2
        const startAngle = Math.atan2(dragState.startY - cy, dragState.startX - cx)
        const currentAngle = Math.atan2(pt.y - cy, pt.x - cx)
        const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI)
        let newRotation = (orig.rotation || 0) + deltaAngle
        // Snap to 15° increments when holding shift
        const shiftKey = 'shiftKey' in e ? (e as React.MouseEvent).shiftKey : false
        if (shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15
        }
        setDragState(p => p ? { ...p, currentShape: { ...p.origShape, rotation: newRotation } } : null)
      } else if (dragState.type === 'resize' && dragState.handle) {
        const h = dragState.handle
        const oBounds = getShapeBounds(orig)

        let newX = oBounds.x, newY = oBounds.y, newW = oBounds.width, newH = oBounds.height
        if (h.includes('w')) { newX = oBounds.x + localDx; newW = oBounds.width - localDx }
        if (h.includes('e')) { newW = oBounds.width + localDx }
        if (h.includes('n')) { newY = oBounds.y + localDy; newH = oBounds.height - localDy }
        if (h.includes('s')) { newH = oBounds.height + localDy }
        const isPointText = orig.autoSize && orig.type === 'textbox-auto'
        const forceAspect = isPointText || ('shiftKey' in e ? (e as React.MouseEvent).shiftKey : false)

        if (forceAspect && oBounds.width > 0 && oBounds.height > 0) {
          const ratio = oBounds.width / oBounds.height
          if (h === 'nw' || h === 'se' || h === 'sw' || h === 'ne') {
            const wRatioScale = newW / oBounds.width
            const hRatioScale = newH / oBounds.height
            if (Math.abs(wRatioScale - 1) > Math.abs(hRatioScale - 1)) {
              newH = newW / ratio
              if (h.includes('n')) newY = oBounds.y + (oBounds.height - newH)
            } else {
              newW = newH * ratio
              if (h.includes('w')) newX = oBounds.x + (oBounds.width - newW)
            }
          } else if (isPointText) {
            // For edge handles on point text, force proportional scaling based on the dragged axis
            if (h === 'n' || h === 's') {
              newW = newH * ratio
              newX = oBounds.x + (oBounds.width - newW) / 2 // keep centered horizontally
            } else if (h === 'e' || h === 'w') {
              newH = newW / ratio
              newY = oBounds.y + (oBounds.height - newH) / 2 // keep centered vertically
            }
          }
        }

        // Enforce minimum size
        if (newW < 10) { newW = 10; if (h.includes('w')) newX = oBounds.x + oBounds.width - 10 }
        if (newH < 10) { newH = 10; if (h.includes('n')) newY = oBounds.y + oBounds.height - 10 }

        if (isPointText) {
          // Proportionally scale the fontSize when resizing point text based on height scale
          const scaleRatio = newH / oBounds.height
          const newFontSize = Math.max(6, Math.min(240, (orig.fontSize || 14) * scaleRatio))
          setDragState(p => p ? { ...p, currentShape: { ...p.origShape, x: newX, y: newY, width: newW, height: newH, fontSize: newFontSize } } : null)
        } else if (orig.points && orig.points.length > 0) {
          const prevW = oBounds.width
          const prevH = oBounds.height
          const scaleX = prevW > 0 ? newW / prevW : 1
          const scaleY = prevH > 0 ? newH / prevH : 1
          const newPoints = orig.points.map(p => ({
            x: newX + (p.x - oBounds.x) * scaleX,
            y: newY + (p.y - oBounds.y) * scaleY
          }))
          setDragState(p => p ? { ...p, currentShape: { ...p.origShape, x: newX, y: newY, width: newW, height: newH, points: newPoints } } : null)
        } else {
          setDragState(p => p ? { ...p, currentShape: { ...p.origShape, x: newX, y: newY, width: newW, height: newH } } : null)
        }
      }
      return
    }

    // Handle drawing
    if (drawingInProgress) {
      e.preventDefault()

      if (drawingInProgress.mode === 'freehand') {
        setDrawingInProgress({
          ...drawingInProgress,
          currentX: pt.x, currentY: pt.y,
          points: [...drawingInProgress.points, { x: pt.x, y: pt.y }],
          shiftKey
        })
      } else if (drawingInProgress.mode === 'polygon' || drawingInProgress.mode === 'connected-lines' || drawingInProgress.mode === 'bezier-line' || drawingInProgress.mode === 'bspline-curve' || drawingInProgress.mode === 'cloud-line') {
        setDrawingInProgress({
          ...drawingInProgress,
          currentX: pt.x, currentY: pt.y,
          shiftKey
        })
      } else {
        setDrawingInProgress({
          ...drawingInProgress,
          currentX: pt.x, currentY: pt.y,
          shiftKey
        })
      }
    }
  }, [drawingMode, drawingInProgress, dragState, marqueeState, getSVGPoint, setDrawingInProgress])

  const finalizeMarqueeSelection = useCallback(() => {
    if (!marqueeState) return
    const mx = Math.min(marqueeState.startX, marqueeState.currentX)
    const my = Math.min(marqueeState.startY, marqueeState.currentY)
    const mw = Math.abs(marqueeState.currentX - marqueeState.startX)
    const mh = Math.abs(marqueeState.currentY - marqueeState.startY)

    if (mw > 3 && mh > 3) {
      const hitIds: string[] = []
      shapes.forEach(shape => {
        if (!shape.visible) return
        const sb = getShapeBounds(shape)
        const intersects = !(
          sb.x + sb.width < mx ||
          sb.x > mx + mw ||
          sb.y + sb.height < my ||
          sb.y > my + mh
        )
        if (intersects) hitIds.push(shape.id)
      })
      if (hitIds.length > 0) {
        setSelectedShapeIds(hitIds)
      } else {
        clearMultiSelect()
      }
    }
    setMarqueeState(null)
  }, [marqueeState, shapes, setSelectedShapeIds, clearMultiSelect])

  const handleCanvasPointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // ── Finish marquee selection ──
    if (marqueeState) {
      finalizeMarqueeSelection()
      return
    }

    // Finish drag
    if (dragState) {
      if (dragState.currentShapes) {
        useDecorationStore.getState().updateShapes(
          Object.values(dragState.currentShapes).map(cs => ({ id: cs.id, updates: cs }))
        )
      } else if (dragState.currentShape) {
        updateShape(dragState.shapeId, dragState.currentShape)
      }
      setDragState(null)
      setSnapGuides({ x: null, y: null })
      setNodeSnapGuide(null)
      return
    }

    if (!drawingInProgress) return
    const pt = getSVGPoint(e as any)

    // For multi-point modes, don't finalize on mouse up
    if (drawingInProgress.mode === 'polygon' || drawingInProgress.mode === 'connected-lines' || drawingInProgress.mode === 'bezier-line' || drawingInProgress.mode === 'bspline-curve' || drawingInProgress.mode === 'cloud-line') {
      return
    }

    // Finalize single-gesture shapes
    const { mode, startX, startY, points, shiftKey } = drawingInProgress
    let endX = pt?.x ?? drawingInProgress.currentX
    let endY = pt?.y ?? drawingInProgress.currentY

    let didNodeSnapEnd = false
    if (!e.altKey && ['line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line', 'polygon'].includes(mode)) {
      const snapNodes = getSnapNodes(shapes)
      let bestDist = 8
      for (const node of snapNodes) {
        if (Math.sqrt(Math.pow(endX - node.x, 2) + Math.pow(endY - node.y, 2)) < bestDist) {
          bestDist = Math.sqrt(Math.pow(endX - node.x, 2) + Math.pow(endY - node.y, 2))
          endX = node.x
          endY = node.y
          didNodeSnapEnd = true
        }
      }
    }

    // Grid snap fallback for end point
    if (!didNodeSnapEnd && gridSize > 0) {
      endX = snapToGrid(endX, gridSize)
      endY = snapToGrid(endY, gridSize)
    }

    if (shiftKey && (mode === 'line' || mode === 'arrow' || mode === 'double-arrow')) {
      const snapped = snapAngle(startX, startY, endX, endY)
      endX = snapped.x
      endY = snapped.y
    } else if (shiftKey && (['rectangle', 'circle', 'triangle', 'star', 'checkmark', 'crossmark', 'dot'].includes(mode) || mode.startsWith('num-') || mode.startsWith('emoji-'))) {
      const dx = endX - startX
      const dy = endY - startY
      const size = Math.max(Math.abs(dx), Math.abs(dy))
      endX = startX + (Math.sign(dx) || 1) * size
      endY = startY + (Math.sign(dy) || 1) * size
    }

    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const w = Math.abs(endX - startX)
    const h = Math.abs(endY - startY)

    // Must have minimum size
    if (mode === 'freehand') {
      if (points.length >= 3) {
        addShape({
          type: 'freehand', x: 0, y: 0, width: 0, height: 0,
          rotation: 0, points, fillColor: 'transparent', fillOpacity: 100,
          strokeColor: globalShapeSettings.strokeColor, strokeWidth: globalShapeSettings.strokeWidth, strokeStyle: globalShapeSettings.strokeStyle, strokeDashPattern: globalShapeSettings.strokeDashPattern,
          visible: true, locked: false, zIndex: shapes.length + 1
        })
      }
    } else if (w > 5 || h > 5 || mode === 'textbox-auto') {
      const isLine = mode === 'line' || mode === 'arrow' || mode === 'double-arrow'
      const isTextbox = mode === 'textbox'
      const isAutoTextbox = mode === 'textbox-auto'
      const isDecoImage = mode === 'deco-image'
      const isDecoSvg = mode === 'deco-svg'

      const dragFontSize = (w > 5 || h > 5) ? Math.max(6, h) : 14

      const shapeData: any = {
        type: mode as any,
        x, y,
        width: isAutoTextbox ? 8 : w,
        height: isAutoTextbox ? dragFontSize * 1.4 + 8 : h,
        rotation: 0,
        points: isLine ? [{ x: startX, y: startY }, { x: endX, y: endY }] : undefined,
        fillColor: isLine ? 'transparent'
          : (isTextbox || isAutoTextbox) ? 'transparent'
            : isDecoImage ? 'transparent'
              : isDecoSvg ? 'transparent'
                : (['checkmark', 'crossmark', 'dot'].includes(mode) ? 'none' : globalShapeSettings.fillColor),
        fillOpacity: (isTextbox || isAutoTextbox) ? 100 : globalShapeSettings.fillOpacity,
        strokeColor: (isTextbox || isAutoTextbox) ? 'transparent' : isDecoImage ? '#cbd5e1' : isDecoSvg ? '#a5b4fc' : (['dot'].includes(mode) ? 'rgba(59, 130, 246, 0.3)' : globalShapeSettings.strokeColor),
        strokeWidth: (isTextbox || isAutoTextbox) ? 0 : isDecoImage || isDecoSvg ? 1 : globalShapeSettings.strokeWidth,
        strokeStyle: (isTextbox || isAutoTextbox) ? 'solid' : isDecoImage || isDecoSvg ? 'solid' : globalShapeSettings.strokeStyle,
        strokeDashPattern: (isTextbox || isAutoTextbox) || isDecoImage || isDecoSvg ? undefined : globalShapeSettings.strokeDashPattern,
        visible: true, locked: false, zIndex: shapes.length + 1,
        text: mode === 'text-callout' ? 'Text' : isTextbox ? 'Type here...' : (isAutoTextbox ? '' : undefined),
        autoSize: isAutoTextbox ? true : undefined,
      }

      // Textbox-specific defaults
      if (isTextbox || isAutoTextbox) {
        shapeData.fontFamily = 'Arial'
        shapeData.fontSize = isAutoTextbox ? dragFontSize : 14
        shapeData.fontWeight = 'normal'
        shapeData.fontStyle = 'normal'
        shapeData.textDecoration = 'none'
        shapeData.textAlign = 'left'
        shapeData.textColor = '#1e293b'
        shapeData.lineHeight = 1.4
      }

      // Image-specific defaults
      if (isDecoImage) {
        shapeData.imageFit = 'cover'
        shapeData.borderRadius = 0
      }

      // SVG-specific defaults
      if (isDecoSvg) {
        shapeData.svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e0e7ff" rx="8"/><text x="50" y="55" text-anchor="middle" font-size="12" fill="#4338ca">SVG</text></svg>'
      }

      const newId = addShape(shapeData)

      if (isTextbox || isAutoTextbox) {
        setDrawingMode(null)
        setSelectedShapeId(newId)
        requestAnimationFrame(() => setEditingShapeId(newId))
      }
    }

    setDrawingInProgress(null)
    setNodeSnapGuide(null)
  }, [drawingInProgress, dragState, getSVGPoint, addShape, shapes.length, setDrawingInProgress, setDrawingMode, setSelectedShapeId, setEditingShapeId])

  // Double-click to finalize polygon / connected-lines, or reset drawing mode
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!drawingInProgress) {
      if (drawingMode) {
        e.preventDefault();
        e.stopPropagation();
        setDrawingMode(null);
      }
      return
    }

    const { mode, points: rawPoints } = drawingInProgress

    // Double-click fires TWO mousedown events before dblclick, adding
    // the same point twice. Strip trailing duplicates so the final
    // curve matches the preview (which only showed N+1 points).
    const points = [...rawPoints]
    while (points.length > 1) {
      const last = points[points.length - 1]
      const prev = points[points.length - 2]
      if (Math.abs(last.x - prev.x) < 2 && Math.abs(last.y - prev.y) < 2) {
        points.pop()
      } else {
        break
      }
    }

    if (mode === 'polygon' && points.length >= 3) {
      addShape({
        type: 'polygon',
        x: 0, y: 0, width: 0, height: 0,
        rotation: 0, points,
        fillColor: globalShapeSettings.fillColor, fillOpacity: globalShapeSettings.fillOpacity,
        strokeColor: globalShapeSettings.strokeColor, strokeWidth: globalShapeSettings.strokeWidth, strokeStyle: globalShapeSettings.strokeStyle, strokeDashPattern: globalShapeSettings.strokeDashPattern,
        visible: true, locked: false, zIndex: shapes.length + 1
      })
      setDrawingInProgress(null)
      setNodeSnapGuide(null)
    } else if ((mode === 'connected-lines' || mode === 'bezier-line' || mode === 'bspline-curve' || mode === 'cloud-line') && points.length >= 2) {
      const finalPoints = mode === 'cloud-line' && points.length >= 3
        ? [...points, { ...points[0] }]
        : points;

      addShape({
        type: mode,
        x: 0, y: 0, width: 0, height: 0,
        rotation: 0, points: finalPoints,
        fillColor: mode === 'cloud-line' ? globalShapeSettings.fillColor : 'transparent', fillOpacity: globalShapeSettings.fillOpacity,
        strokeColor: globalShapeSettings.strokeColor, strokeWidth: globalShapeSettings.strokeWidth, strokeStyle: globalShapeSettings.strokeStyle, strokeDashPattern: globalShapeSettings.strokeDashPattern,
        visible: true, locked: false, zIndex: shapes.length + 1
      })
      setDrawingInProgress(null)
      setNodeSnapGuide(null)
    } else if (drawingMode) {
      // Exit drawing mode if double clicked while using a normal tool
      e.preventDefault();
      e.stopPropagation();
      setDrawingMode(null);
      setDrawingInProgress(null);
    }
  }, [marqueeState, finalizeMarqueeSelection, shapes, setSelectedShapeIds, clearMultiSelect, drawingInProgress, dragState, addShape, updateShape, setDragState, setSnapGuides, setNodeSnapGuide, setDrawingInProgress, globalShapeSettings, drawingMode, setDrawingMode])

  // ── Shape interaction handlers ─────────────────────

  const handleShapePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, shape: DecorationShape) => {
    if (panMode || drawingMode) return
    e.preventDefault()
    e.stopPropagation()

    const isShift = 'shiftKey' in e ? (e as React.MouseEvent).shiftKey : false

    if (shape.locked) {
      if (isShift) toggleShapeSelection(shape.id)
      else setSelectedShapeId(shape.id)
      return
    }

    if (isShift) {
      toggleShapeSelection(shape.id)
    } else {
      if (!selectedShapeIds.includes(shape.id)) {
        setSelectedShapeId(shape.id)
      }
    }

    const pt = getSVGPoint(e as any)
    if (!pt) return

    let draggingShapes = [shape]
    // Note: use local 'isShift' state since updated selectedShapeIds won't reflect synchronously for shift clicks
    if (!isShift && selectedShapeIds.includes(shape.id) && selectedShapeIds.length > 1) {
      draggingShapes = shapes.filter(s => selectedShapeIds.includes(s.id))
    }

    setDragState({
      type: 'move',
      shapeId: shape.id,
      startX: pt.x,
      startY: pt.y,
      origShape: { ...shape },
      origShapes: draggingShapes.map(s => ({ ...s }))
    })
  }, [panMode, drawingMode, getSVGPoint, setSelectedShapeId, toggleShapeSelection, selectedShapeIds, shapes])

  const handleResizePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, shape: DecorationShape, handle: HandlePosition) => {
    e.preventDefault()
    e.stopPropagation()
    const pt = getSVGPoint(e as any)
    if (!pt || shape.locked) return

    setDragState({
      type: 'resize',
      shapeId: shape.id,
      startX: pt.x,
      startY: pt.y,
      origShape: { ...shape },
      handle
    })
  }, [getSVGPoint])

  // ── Click on background to deselect ────────────────

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false
      return
    }
    // Only deselect if both mousedown and click happened directly on the SVG background.
    // This prevents deselecting when clicking a shape's thin stroke (mousedown), which renders the thick invisible
    // hit area under the mouse, causing the browser's synthesized click event to target the common parent (SVG).
    if (e.target === svgRef.current && lastMouseDownTargetRef.current === svgRef.current && !drawingInProgress) {
      if (drawingMode === 'marquee-select') {
        // Don't deselect on background click in marquee mode — only the drag gesture matters
        return
      }
      if (!drawingMode) {
        setSelectedShapeId(null)
        clearMultiSelect()
        setEditingShapeId(null)
      }
    }
  }, [drawingMode, drawingInProgress, setSelectedShapeId, clearMultiSelect])

  // ── Double-click on textbox to enter editing ──────

  const handleTextboxDoubleClick = useCallback((e: React.MouseEvent, shape: DecorationShape) => {
    if (panMode || drawingMode) return
    if (shape.type !== 'textbox' && shape.type !== 'textbox-auto') return
    e.preventDefault()
    e.stopPropagation()
    setEditingShapeId(shape.id)
  }, [panMode, drawingMode])

  // ── Save editing content back to shape ────────────

  const handleEditingSave = useCallback(() => {
    if (!editingShapeId || !editRef.current) return
    let html = editRef.current.innerHTML || ''

    // Clean up trailing browser-inserted break tags safely without breaking intended blank lines
    // We only remove a trailing <br> if it's the very last thing, as browsers inject them for caret positioning
    if (html.endsWith('<br>')) { html = html.slice(0, -4) }

    // Also remove empty <p></p> or <div></div> that might have sneaked in
    html = html.replace(/<p>(\s|&nbsp;|<br>)*<\/p>$/, '')
    html = html.replace(/<div>(\s|&nbsp;|<br>)*<\/div>$/, '')

    // Delete the shape entirely if completely empty instead of leaving an invisible box
    if (!html.trim() && !html.includes('<img')) {
      useDecorationStore.getState().removeShape(editingShapeId)
    } else {
      updateShape(editingShapeId, { text: html })
    }
    setEditingShapeId(null)
  }, [editingShapeId, updateShape])

  // Focus the contentEditable and attach resize measurement
  useEffect(() => {
    if (editingShapeId && editRef.current) {
      const storeState = useDecorationStore.getState()
      const shape = storeState.shapes.find(s => s.id === editingShapeId)

      if (shape) {
        editRef.current.innerHTML = shape.text || ''
      }

      editRef.current.focus()
      // Place cursor at end
      const range = document.createRange()
      range.selectNodeContents(editRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)

      // Observe the editing div to update the shape's bounds automatically
      // We do this so the selection bounding box matches the typed text dynamically.
      let observer: ResizeObserver | null = null;
      if (shape && shape.autoSize) {
        observer = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const el = entry.target as HTMLDivElement
            // offsetWidth/Height reflect the layout size accurately.
            // deco-edit-zone has 4px padding (8px total) and 2px border (4px total) = 12px total extra size
            // We want the saved shape to INCLUDE 8px padding so the visual text is padded inside the rect!
            // Therefore, we only subtract the 4px border.
            const newW = Math.max(0, el.offsetWidth - 4)
            const newH = Math.max(0, el.offsetHeight - 4)

            const currentShape = useDecorationStore.getState().shapes.find(s => s.id === editingShapeId)
            if (currentShape && (Math.abs(currentShape.width - newW) > 1 || Math.abs(currentShape.height - newH) > 1)) {
              useDecorationStore.getState().updateShape(editingShapeId, { width: newW, height: newH }, true)
            }
          }
        })
        observer.observe(editRef.current)
      }

      return () => {
        if (observer) observer.disconnect()
      }
    }
  }, [editingShapeId]) // Removed 'shapes' from deps to prevent cursor resetting on every keystroke!

  // ── Track cursor position for "A" preview ─────────

  const handleCursorTrack = useCallback((e: React.MouseEvent) => {
    if (drawingMode === 'textbox-auto' && !drawingInProgress) {
      const pt = getSVGPoint(e as any)
      if (pt) setCursorPos(pt)
    } else {
      if (cursorPos) setCursorPos(null)
    }
  }, [drawingMode, drawingInProgress, getSVGPoint, cursorPos])

  // ── Global mouse up (catch releases outside SVG) ──

  useEffect(() => {
    const handleGlobalUp = () => {
      if (dragState) {
        if (dragState.currentShapes) {
          useDecorationStore.getState().updateShapes(
            Object.values(dragState.currentShapes).map(cs => ({ id: cs.id, updates: cs }))
          )
        } else if (dragState.currentShape) {
          updateShape(dragState.shapeId, dragState.currentShape)
        }
        setDragState(null)
        setSnapGuides({ x: null, y: null })
        setNodeSnapGuide(null)
      }
      if (marqueeState) {
        finalizeMarqueeSelection()
      }
    }
    window.addEventListener('mouseup', handleGlobalUp)
    window.addEventListener('touchend', handleGlobalUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp)
      window.removeEventListener('touchend', handleGlobalUp)
    }
  }, [dragState, marqueeState, finalizeMarqueeSelection, updateShape])

  // ── Escape key to cancel drawing ──────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Do not intercept keystrokes if the user is typing in an input, textarea, or contentEditable element.
      // E.g., when they are renaming a chart, or editing text within a template zone.
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
        return;
      }

      const state = useDecorationStore.getState()

      // ── Undo / Redo ───────────────────────────────────
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (state.canUndo()) {
          e.preventDefault()
          state.undoShapeAction()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) {
        if (state.canRedo()) {
          e.preventDefault()
          state.redoShapeAction()
        }
        return
      }

      // ── Escape ────────────────────────────────────────
      if (e.key === 'Escape') {
        setDrawingInProgress(null)
        setMarqueeState(null)
        state.setDrawingMode(null)
        setNodeSnapGuide(null)
      }

      // ── Delete ────────────────────────────────────────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete multi-selected shapes
        if (state.selectedShapeIds.length > 0) {
          state.selectedShapeIds.forEach(id => state.removeShape(id))
          state.clearMultiSelect()
          return
        }
        // Delete single-selected shape
        if (state.selectedShapeId) {
          state.removeShape(state.selectedShapeId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setDrawingInProgress])

  // Sync drawingMode -> clear drawingInProgress if cancelled externally
  useEffect(() => {
    if (!drawingMode) {
      setDrawingInProgress(null)
    }
  }, [drawingMode, setDrawingInProgress])

  // ── Determine cursor ──────────────────────────────

  const getCursor = (): string => {
    if (panMode) return 'grab'
    if (marqueeState) return 'crosshair'
    if (drawingMode === 'marquee-select') return 'crosshair'
    if (drawingMode) return 'crosshair'
    if (dragState?.type === 'move') return 'move'
    if (dragState?.type === 'rotate') return ROTATE_CURSOR
    return 'default'
  }

  // ── Sort shapes by zIndex ─────────────────────────

  // Merge drag state overrides down using purely local rendering
  const activeShapes = React.useMemo(() => {
    if (!dragState) return shapes
    if (dragState.type === 'move' && dragState.currentShapes) {
      return shapes.map(s => dragState.currentShapes![s.id] || s)
    }
    if (dragState.currentShape) {
      return shapes.map(s => s.id === dragState.shapeId ? dragState.currentShape! : s)
    }
    return shapes
  }, [shapes, dragState])

  const sortedShapes = React.useMemo(() => {
    return [...activeShapes].filter(s => s.visible).sort((a, b) => a.zIndex - b.zIndex)
  }, [activeShapes])

  const selectedShape = React.useMemo(() => {
    return activeShapes.find(s => s.id === selectedShapeId)
  }, [activeShapes, selectedShapeId])

  const svgElement = (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full ${drawingMode ? 'outline-none focus:outline-none' : ''}`}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      style={{
        cursor: getCursor(),
        // Exclusive Focus Mode: If a shape is selected, or we are drawing/dragging, 
        // the SVG catches ALL clicks and blocks the underlying format zones.
        pointerEvents: (!panMode && (drawingMode || dragState || marqueeState || selectedShapeId || selectedShapeIds.length > 0 || editingShapeId)) ? 'auto' : 'none',
        zIndex: 20
      }}
      // These events will only fire on the SVG itself when drawingMode is true OR during drag
      onMouseDown={(drawingMode || dragState || marqueeState) ? (handleCanvasPointerDown as any) : undefined}
      onMouseDownCapture={(e) => { lastMouseDownTargetRef.current = e.target }}
      onMouseMove={(e: any) => { handleCursorTrack(e); (handleCanvasPointerMove as any)(e) }}
      onMouseUp={handleCanvasPointerUp as any}
      onMouseLeave={() => { setCursorPos(null) }}
      onDoubleClick={drawingMode ? handleCanvasDoubleClick : undefined}
      onTouchStart={(drawingMode || dragState || marqueeState) ? (handleCanvasPointerDown as any) : undefined}
      onTouchMove={handleCanvasPointerMove as any}
      onTouchEnd={handleCanvasPointerUp as any}
      onClick={handleBackgroundClick}
    >
      {/* Invisible background to catch deselection clicks when not drawing,
          placed behind shapes so it doesn't block them, but only active when NOT drawing
          so it doesn't intercept drawing clicks. 
          WAIT — we want Format Zones to be clickable when not drawing. 
          If we have this rect, it blocks Format Zones! 
          Instead, we rely on the FormatRenderer's background click handler to clear BOTH format selection AND decoration selection.
      */}

      {/* Anti-pixelation: Chrome bitmap-caches SVGs with only geometric shapes
          under CSS transform:scale(), but must render <text> at display resolution.
          This tiny invisible text forces Chrome to keep full-res rendering. */}
      <text x="0" y="0" fontSize="1" fill="rgba(0,0,0,0.01)" style={{ pointerEvents: 'none' }} aria-hidden="true">.</text>

      {/* Shapes */}
      {sortedShapes.map(shape => (
        <g
          key={shape.id}
          style={{
            opacity: shape.locked ? 0.8 : 1,
            pointerEvents: 'auto', // Important: shapes catch clicks even if SVG doesn't
            cursor: drawingMode ? 'crosshair' : (shape.locked ? 'default' : 'move')
          }}
          onMouseDown={(e) => handleShapePointerDown(e, shape)}
          onTouchStart={(e) => handleShapePointerDown(e, shape)}
          onMouseEnter={() => setHoveredShapeId(shape.id)}
          onMouseLeave={() => setHoveredShapeId(null)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => handleTextboxDoubleClick(e, shape)}
        >
          <ShapeSVG shape={shape} />

          {/* Hover highlight — uses computed bounds */}
          {hoveredShapeId === shape.id && selectedShapeId !== shape.id && (() => {
            const hb = getShapeBounds(shape)
            return (
              <rect
                x={hb.x - 3} y={hb.y - 3}
                width={hb.width + 6} height={hb.height + 6}
                fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4,3"
                rx={3} pointerEvents="none" opacity={0.7}
              />
            )
          })()}
        </g>
      ))}

      {/* Multi-select highlights */}
      {selectedShapeIds.length > 1 && selectedShapeIds.map(sid => {
        const ms = activeShapes.find(s => s.id === sid)
        if (!ms || !ms.visible) return null
        const msb = getShapeBounds(ms)
        const msCx = msb.x + msb.width / 2
        const msCy = msb.y + msb.height / 2
        return (
          <g key={`multisel-${sid}`}>
            <rect
              x={msb.x - 3} y={msb.y - 3}
              width={msb.width + 6} height={msb.height + 6}
              fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5,3"
              rx={3} pointerEvents="none"
              transform={ms.rotation ? `rotate(${ms.rotation} ${msCx} ${msCy})` : undefined}
            />
          </g>
        )
      })}

      {/* Selection UI */}
      {selectedShape && (() => {
        const sb = getShapeBounds(selectedShape)
        const isPointsShape = isPointsBased(selectedShape.type)
        const hasPointsUI = hasEditablePoints(selectedShape.type)
        const rotCx = sb.x + sb.width / 2
        const rotCy = sb.y - ROTATION_HANDLE_DISTANCE

        const cx = sb.x + sb.width / 2
        const cy = sb.y + sb.height / 2
        const rotation = selectedShape.rotation || 0

        // Global bounds of the shape including rotation
        const corners = [
          { x: sb.x, y: sb.y },
          { x: sb.x + sb.width, y: sb.y },
          { x: sb.x + sb.width, y: sb.y + sb.height },
          { x: sb.x, y: sb.y + sb.height }
        ]
        const rotatedCorners = corners.map(pt => rotatePoint(pt.x, pt.y, cx, cy, rotation))
        const globalMinY = Math.min(...rotatedCorners.map(pt => pt.y))
        const globalMaxY = Math.max(...rotatedCorners.map(pt => pt.y))

        // Include rotation handle in top/bottom extent
        const rotHandleRotated = rotatePoint(rotCx, rotCy, cx, cy, rotation)
        const topObjectY = Math.min(globalMinY, rotHandleRotated.y)
        const bottomObjectY = Math.max(globalMaxY, rotHandleRotated.y)

        const isTextbox = selectedShape.type === 'textbox' || selectedShape.type === 'textbox-auto'
        const toolbarWidth = isTextbox ? 660 : 200
        const gap = 20
        const toolbarHeight = 44

        let toolbarYPosition = topObjectY - gap - toolbarHeight
        // If it goes off top edge, place below instead
        if (toolbarYPosition < 10) {
          toolbarYPosition = bottomObjectY + gap
        }

        let toolbarXPosition = cx - toolbarWidth / 2
        // Constrain to container boundaries horizontally
        if (toolbarXPosition < 10) toolbarXPosition = 10
        if (toolbarWidth < containerWidth && toolbarXPosition + toolbarWidth > containerWidth - 10) {
          toolbarXPosition = containerWidth - toolbarWidth - 10
        }

        return (
          <g style={{ pointerEvents: 'auto' }}>
            {/* ── Elements outside rotation ────────────────── */}
            {/* Toolbar — stays horizontal, correctly positioned outside bounds, invisible during drag/rotate. */}
            {!dragState && (
              <DecorationToolbar
                shapeId={selectedShape.id}
                x={toolbarXPosition}
                y={toolbarYPosition}
                editingShapeId={editingShapeId}
                onStartEditing={(id) => setEditingShapeId(id)}
              />
            )}

            {/* ── Transformed Selection Frame ──────────────── */}
            <g transform={`rotate(${selectedShape.rotation || 0} ${sb.x + sb.width / 2} ${sb.y + sb.height / 2})`}>
              {/* Invisible drag-hit area over the entire shape bounds */}
              {!selectedShape.locked && (
                <rect
                  x={sb.x} y={sb.y}
                  width={sb.width} height={sb.height}
                  fill="transparent"
                  style={{ cursor: 'move', pointerEvents: 'auto' }}
                  onMouseDown={(e) => handleShapePointerDown(e, selectedShape)}
                  onTouchStart={(e) => handleShapePointerDown(e, selectedShape)}
                  onDoubleClick={(e) => handleTextboxDoubleClick(e, selectedShape)}
                />
              )}

              {/* Selection border */}
              <rect
                x={sb.x - 3} y={sb.y - 3}
                width={sb.width + 6} height={sb.height + 6}
                fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5,3"
                rx={3} pointerEvents="none"
              />

              {/* Rotation handle — now inside transformed group */}
              {!selectedShape.locked && (
                <>
                  <line
                    x1={rotCx} y1={sb.y}
                    x2={rotCx} y2={rotCy + 5}
                    stroke="#3b82f6" strokeWidth={1}
                    pointerEvents="none"
                  />
                  <circle
                    cx={rotCx} cy={rotCy} r={5}
                    fill="white"
                    stroke="#3b82f6" strokeWidth={1.5}
                    style={{ cursor: ROTATE_CURSOR }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const rPt = getSVGPoint(e as any)
                      if (!rPt) return
                      setDragState({
                        type: 'rotate',
                        shapeId: selectedShape.id,
                        startX: rPt.x, startY: rPt.y,
                        origShape: { ...selectedShape }
                      })
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const rPt = getSVGPoint(e as any)
                      if (!rPt) return
                      setDragState({
                        type: 'rotate',
                        shapeId: selectedShape.id,
                        startX: rPt.x, startY: rPt.y,
                        origShape: { ...selectedShape }
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </>
              )}

              {/* Resize handles — now inside transformed group */}
              {!hasPointsUI && !selectedShape.locked && getHandlePositions(selectedShape).map(({ pos, x, y, cursor }) => (
                <rect
                  key={pos}
                  x={x - HANDLE_SIZE / 2} y={y - HANDLE_SIZE / 2}
                  width={HANDLE_SIZE} height={HANDLE_SIZE}
                  fill="white" stroke="#3b82f6" strokeWidth={1.5}
                  rx={2}
                  style={{ cursor }}
                  onMouseDown={(e) => handleResizePointerDown(e, selectedShape, pos)}
                  onTouchStart={(e) => handleResizePointerDown(e, selectedShape, pos)}
                  onClick={(e) => e.stopPropagation()}
                />
              ))}

              {/* Line/arrow/polygon: endpoint circle handles at each point */}
              {hasPointsUI && selectedShape.points && selectedShape.points.length >= 2 && !selectedShape.locked && (
                <>
                  {selectedShape.points.map((pt, idx) => (
                    <circle
                      key={`ep-${idx}`}
                      cx={pt.x} cy={pt.y} r={6}
                      fill="white" stroke="#3b82f6" strokeWidth={2}
                      style={{ cursor: 'crosshair' }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const ePt = getSVGPoint(e as any)
                        if (!ePt) return
                        setDragState({
                          type: 'endpoint',
                          shapeId: selectedShape.id,
                          startX: ePt.x, startY: ePt.y,
                          origShape: { ...selectedShape, points: [...selectedShape.points!] },
                          endpointIndex: idx
                        })
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const ePt = getSVGPoint(e as any)
                        if (!ePt) return
                        setDragState({
                          type: 'endpoint',
                          shapeId: selectedShape.id,
                          startX: ePt.x, startY: ePt.y,
                          origShape: { ...selectedShape, points: [...selectedShape.points!] },
                          endpointIndex: idx
                        })
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ))}
                </>
              )}
            </g>
          </g>
        )
      })()}

      {/* Drawing preview */}
      {drawingInProgress && <DrawingPreview drawing={drawingInProgress} settings={globalShapeSettings} />}

      {/* Marquee selection rectangle */}
      {marqueeState && (() => {
        const mx = Math.min(marqueeState.startX, marqueeState.currentX)
        const my = Math.min(marqueeState.startY, marqueeState.currentY)
        const mw = Math.abs(marqueeState.currentX - marqueeState.startX)
        const mh = Math.abs(marqueeState.currentY - marqueeState.startY)
        return (
          <g pointerEvents="none">
            {/* Fill */}
            <rect
              x={mx} y={my} width={mw} height={mh}
              fill="rgba(139, 92, 246, 0.08)"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="6,3"
              rx={2}
            />
            {/* Corner dots */}
            <circle cx={mx} cy={my} r={3} fill="#8b5cf6" />
            <circle cx={mx + mw} cy={my} r={3} fill="#8b5cf6" />
            <circle cx={mx} cy={my + mh} r={3} fill="#8b5cf6" />
            <circle cx={mx + mw} cy={my + mh} r={3} fill="#8b5cf6" />
          </g>
        )
      })()}

      {/* Snap Guides */}
      {snapGuides.x !== null && (
        <line x1={snapGuides.x} y1={0} x2={snapGuides.x} y2={containerHeight} stroke="#ec4899" strokeWidth={1} strokeDasharray="4,4" pointerEvents="none" opacity={0.6} />
      )}
      {snapGuides.y !== null && (
        <line x1={0} y1={snapGuides.y} x2={containerWidth} y2={snapGuides.y} stroke="#ec4899" strokeWidth={1} strokeDasharray="4,4" pointerEvents="none" opacity={0.6} />
      )}

      {/* Node Snap Guide Indicator */}
      {nodeSnapGuide && (
        <circle cx={nodeSnapGuide.x} cy={nodeSnapGuide.y} r={5} fill="#ec4899" opacity={0.6} pointerEvents="none" stroke="#fff" strokeWidth={1.5} />
      )}

      {/* "A" cursor preview for textbox-auto tool */}
      {drawingMode === 'textbox-auto' && !drawingInProgress && cursorPos && (
        <g style={{ pointerEvents: 'none' }}>
          {/* Blinking cursor line */}
          <line
            x1={cursorPos.x} y1={cursorPos.y - 18}
            x2={cursorPos.x} y2={cursorPos.y + 2}
            stroke="#ec4899" strokeWidth={1.5}
            opacity={0.9}
          >
            <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1s" repeatCount="indefinite" />
          </line>
          {/* "A" character showing text height */}
          <text
            x={cursorPos.x + 4}
            y={cursorPos.y}
            fontSize="18"
            fontFamily="Arial"
            fontWeight="bold"
            fill="#3b82f6"
            opacity={0.5}
          >A</text>
          {/* Height indicator */}
          <text
            x={cursorPos.x + 24}
            y={cursorPos.y}
            fontSize="9"
            fontFamily="Arial"
            fill="#64748b"
            opacity={0.6}
          >H: 14 pt</text>
        </g>
      )}

      {/* Inline contentEditable editing overlay for textboxes */}
      {editingShapeId && (() => {
        const editShape = shapes.find(s => s.id === editingShapeId)
        if (!editShape) return null
        if (editShape.type !== 'textbox' && editShape.type !== 'textbox-auto') return null
        const isAutoSized = editShape.autoSize && editShape.type === 'textbox-auto'
        const ex = editShape.x
        const ey = editShape.y
        const fSize = editShape.fontSize || 14
        return (
          <foreignObject
            x={ex - 2}
            y={ey - 2}
            width={isAutoSized ? 2000 : Math.max(0, editShape.width + 4)}
            height={isAutoSized ? 2000 : Math.max(0, editShape.height + 4)}
            style={{ overflow: 'visible', zIndex: 50 }}
          >
            <style>{`
              .deco-edit-zone p, .deco-edit-zone div { margin: 0; padding: 0; }
              .deco-edit-zone ul { list-style-type: disc; padding-left: 16px; margin: 2px 0; }
              .deco-edit-zone ol { list-style-type: decimal; padding-left: 16px; margin: 2px 0; }
              .deco-edit-zone li { margin-bottom: 1px; }
            `}</style>
            <div
              ref={editRef}
              className="deco-edit-zone"
              contentEditable
              suppressContentEditableWarning
              style={{
                width: isAutoSized ? 'max-content' : '100%',
                minWidth: isAutoSized ? '6px' : undefined,
                height: isAutoSized ? 'auto' : '100%',
                display: isAutoSized ? 'inline-block' : 'block',
                fontSize: `${fSize}px`,
                fontFamily: editShape.fontFamily || 'Arial',
                fontWeight: editShape.fontWeight || 'normal',
                fontStyle: editShape.fontStyle || 'normal',
                textDecoration: editShape.textDecoration || 'none',
                textAlign: (editShape.textAlign || 'left') as any,
                color: editShape.textColor || '#1e293b',
                lineHeight: editShape.lineHeight ? `${editShape.lineHeight}` : '1.4',
                wordBreak: 'break-word' as const,
                whiteSpace: 'pre-wrap',
                outline: 'none',
                cursor: 'text',
                background: 'rgba(255,255,255,0.95)',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                padding: '4px',
                boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
              }}
              onInput={() => {
                if (!editRef.current) return
                updateShape(editingShapeId!, { text: editRef.current.innerHTML || '' })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleEditingSave()
                }
                // Prevent deletion/backspace from removing the shape
                e.stopPropagation()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </foreignObject>
        )
      })()}
    </svg>
  )

  if (drawingMode) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {svgElement}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              setDrawingMode(null)
              setDrawingInProgress(null)
            }}
          >
            Unselect Tool
          </ContextMenuItem>
          <ContextMenuItem>
            Cancel
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return svgElement
}
