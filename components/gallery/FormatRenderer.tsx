"use client"

import { sanitizeHTML, sanitizeSVG } from "@/lib/utils/sanitize"

/**
 * FormatRenderer
 * 
 * Takes a RenderedFormat (skeleton + resolved content) and renders it as
 * a positioned DOM element. Each zone is absolutely positioned within the
 * canvas based on its defined position in the skeleton.
 * 
 * Interactive mode adds:
 *   - Hover highlights on zones
 *   - Click-to-select with selection border
 *   - Double-click inline editing for text/stat zones
 *   - Floating rich text toolbar for selected text/stat zones
 */

import React, { useMemo, useRef, useCallback, useEffect, useState } from "react"

import type {
  RenderedFormat,
  RenderedZone,
  TextZone,
  ChartZone,
  StatZone,
  BackgroundZone,
  DecorationZone,
  ImageZone,
  FormatColorPalette,
} from "@/lib/format-types"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { FormatZoneToolbar } from "@/components/format/FormatZoneToolbar"
import { ChartGenerator } from "@/lib/chart_generator"
import { getPatternCSS } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/utils/image-proxy-utils"
import { Maximize2, X, Move } from "lucide-react"

// ========================================
// COLLISION-AWARE RESIZE HELPERS
// ========================================

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Obstacle {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/** Checks if two rectangles overlap with strict positive intersection area */
function checkRectOverlap(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  )
}

/**
 * Clamps a proposed zone resize against canvas bounds and all obstacle zones.
 * Guarantees that zones never overlay / penetrate one another.
 */
function clampResizeWithCollisions(
  proposed: Rect,
  handle: string,
  startRect: Rect,
  canvasWidth: number,
  canvasHeight: number,
  obstacles: Obstacle[],
  minWidth = 40,
  minHeight = 30
): Rect {
  let { x, y, width, height } = proposed

  // Clamp right edge if 'e' is active
  if (handle.includes('e')) {
    let maxRight = canvasWidth
    for (const b of obstacles) {
      const yOverlap = Math.max(y, b.y) < Math.min(y + height, b.y + b.height)
      if (yOverlap && b.x >= startRect.x) {
        maxRight = Math.min(maxRight, b.x)
      }
    }
    const right = Math.min(x + width, maxRight)
    width = Math.max(minWidth, right - x)
  }

  // Clamp bottom edge if 's' is active
  if (handle.includes('s')) {
    let maxBottom = canvasHeight
    for (const b of obstacles) {
      const xOverlap = Math.max(x, b.x) < Math.min(x + width, b.x + b.width)
      if (xOverlap && b.y >= startRect.y) {
        maxBottom = Math.min(maxBottom, b.y)
      }
    }
    const bottom = Math.min(y + height, maxBottom)
    height = Math.max(minHeight, bottom - y)
  }

  // Clamp left edge if 'w' is active
  if (handle.includes('w')) {
    const fixedRight = startRect.x + startRect.width
    let minLeft = 0
    for (const b of obstacles) {
      const yOverlap = Math.max(y, b.y) < Math.min(y + height, b.y + b.height)
      if (yOverlap && b.x + b.width <= fixedRight) {
        minLeft = Math.max(minLeft, b.x + b.width)
      }
    }
    x = Math.max(minLeft, Math.min(x, fixedRight - minWidth))
    width = fixedRight - x
  }

  // Clamp top edge if 'n' is active
  if (handle.includes('n')) {
    const fixedBottom = startRect.y + startRect.height
    let minTop = 0
    for (const b of obstacles) {
      const xOverlap = Math.max(x, b.x) < Math.min(x + width, b.x + b.width)
      if (xOverlap && b.y + b.height <= fixedBottom) {
        minTop = Math.max(minTop, b.y + b.height)
      }
    }
    y = Math.max(minTop, Math.min(y, fixedBottom - minHeight))
    height = fixedBottom - y
  }

  const result: Rect = {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  }

  // Safety pass: verify clamped result against all obstacles
  for (const b of obstacles) {
    if (checkRectOverlap(result, b)) {
      return startRect
    }
  }

  return result
}

/**
 * Clamps a proposed zone move (x, y) against canvas bounds and all obstacle zones.
 * Guarantees that zones never overlay / overlap one another.
 * Allows smooth sliding along obstacle edges within available free spaces.
 */
function clampMoveWithCollisions(
  proposedX: number,
  proposedY: number,
  width: number,
  height: number,
  startRect: Rect,
  canvasWidth: number,
  canvasHeight: number,
  obstacles: Obstacle[]
): Rect {
  const maxX = Math.max(0, canvasWidth - width)
  const maxY = Math.max(0, canvasHeight - height)

  const targetX = Math.max(0, Math.min(maxX, proposedX))
  const targetY = Math.max(0, Math.min(maxY, proposedY))

  const totalDx = targetX - startRect.x
  const totalDy = targetY - startRect.y

  if (totalDx === 0 && totalDy === 0) {
    return startRect
  }

  // Pre-calculate any obstacles that were already intersecting at startRect
  // to allow moving apart if a template had existing overlap
  const initialOverlaps = new Set(
    obstacles.filter(b => checkRectOverlap(startRect, b)).map(b => b.id)
  )

  const isCollisionFree = (candidate: Rect) => {
    for (const b of obstacles) {
      if (checkRectOverlap(candidate, b)) {
        if (!initialOverlaps.has(b.id)) {
          return false
        }
      }
    }
    return true
  }

  // Continuous collision detection via distance-based sub-steps (max 2px per step)
  const dist = Math.max(Math.abs(totalDx), Math.abs(totalDy))
  const steps = Math.min(200, Math.max(1, Math.ceil(dist / 2)))

  let currentX = startRect.x
  let currentY = startRect.y

  for (let i = 1; i <= steps; i++) {
    const fraction = i / steps
    const stepTargetX = Math.max(0, Math.min(maxX, startRect.x + totalDx * fraction))
    const stepTargetY = Math.max(0, Math.min(maxY, startRect.y + totalDy * fraction))

    // 1. Try moving along X
    if (stepTargetX !== currentX) {
      const candidateX: Rect = { x: stepTargetX, y: currentY, width, height }
      if (isCollisionFree(candidateX)) {
        currentX = stepTargetX
      } else {
        // Find the closest obstacle boundary that blocks X and snap flush
        let flushX = totalDx > 0 ? -Infinity : Infinity
        for (const b of obstacles) {
          if (initialOverlaps.has(b.id)) continue
          if (checkRectOverlap(candidateX, b)) {
            if (totalDx > 0) {
              const snap = b.x - width
              if (snap >= currentX) {
                flushX = Math.max(flushX, snap)
              }
            } else if (totalDx < 0) {
              const snap = b.x + b.width
              if (snap <= currentX) {
                flushX = Math.min(flushX, snap)
              }
            }
          }
        }
        if (Number.isFinite(flushX) && flushX !== currentX) {
          const testFlush: Rect = { x: flushX, y: currentY, width, height }
          if (isCollisionFree(testFlush)) {
            currentX = flushX
          }
        }
      }
    }

    // 2. Try moving along Y (independent axis sliding)
    if (stepTargetY !== currentY) {
      const candidateY: Rect = { x: currentX, y: stepTargetY, width, height }
      if (isCollisionFree(candidateY)) {
        currentY = stepTargetY
      } else {
        // Find the closest obstacle boundary that blocks Y and snap flush
        let flushY = totalDy > 0 ? -Infinity : Infinity
        for (const b of obstacles) {
          if (initialOverlaps.has(b.id)) continue
          if (checkRectOverlap(candidateY, b)) {
            if (totalDy > 0) {
              const snap = b.y - height
              if (snap >= currentY) {
                flushY = Math.max(flushY, snap)
              }
            } else if (totalDy < 0) {
              const snap = b.y + b.height
              if (snap <= currentY) {
                flushY = Math.min(flushY, snap)
              }
            }
          }
        }
        if (Number.isFinite(flushY) && flushY !== currentY) {
          const testFlush: Rect = { x: currentX, y: flushY, width, height }
          if (isCollisionFree(testFlush)) {
            currentY = flushY
          }
        }
      }
    }
  }

  const result: Rect = {
    x: Math.round(currentX),
    y: Math.round(currentY),
    width: Math.round(width),
    height: Math.round(height),
  }

  if (isCollisionFree(result)) {
    return result
  }

  const floorResult: Rect = {
    x: Math.floor(currentX),
    y: Math.floor(currentY),
    width: Math.round(width),
    height: Math.round(height),
  }
  if (isCollisionFree(floorResult)) {
    return floorResult
  }

  return startRect
}

// ========================================
// MAIN RENDERER
// ========================================

interface FormatRendererProps {
  rendered: RenderedFormat
  /** Scale factor (0-1) for preview mode. Default 1 = full size */
  scale?: number
  /** Optional className for the outer wrapper */
  className?: string
  /** Whether to show interactivity hints */
  interactive?: boolean
  /** Whether pan mode is active (disables interaction) */
  panMode?: boolean
  /** Force real ChartJS rendering even when not interactive (used in share page) */
  forceRealChart?: boolean
  /** The actual optical zoom level (used for Chart devicePixelRatio) */
  zoomLevel?: number
  /** Force rendering the actual ChartJS canvas locally instead of using ChartGenerator */
  renderLocalCanvas?: boolean
}

export function FormatRenderer({
  rendered,
  scale = 1,
  className = "",
  interactive = false,
  panMode = false,
  forceRealChart = false,
  zoomLevel = 1,
  renderLocalCanvas = false,
}: FormatRendererProps) {
  const { skeleton, renderedZones, colorPalette } = rendered
  const { width, height } = skeleton.dimensions
  const {
    selectedZoneId,
    setSelectedZoneId,
    setEditingZoneId,
    isResizeMode,
    setResizeMode
  } = useFormatGalleryStore()
  const { setSelectedShapeId, drawingMode } = useDecorationStore()

  const scaledW = width * scale
  const scaledH = height * scale

  // Positioned obstacles for collision detection (all visible non-background zones with positions)
  const allObstacles = useMemo(() => {
    return renderedZones
      .filter(rz => rz.zone.position && rz.zone.type !== 'background' && (rz.zone as any).visible !== false)
      .map(rz => ({
        id: rz.zone.id,
        x: rz.zone.position!.x,
        y: rz.zone.position!.y,
        width: rz.zone.position!.width,
        height: rz.zone.position!.height,
      }))
  }, [renderedZones])

  // Click on background to deselect
  const handleBgClick = useCallback((e: React.MouseEvent) => {
    if (interactive && !panMode) {
      setSelectedZoneId(null)
      setSelectedShapeId(null)
      setEditingZoneId(null)
    }
  }, [interactive, panMode, setSelectedZoneId, setSelectedShapeId, setEditingZoneId])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: scaledW,
        height: scaledH,
        fontSize: `${Math.max(scale * 100, 30)}%`,
        pointerEvents: (panMode || (drawingMode as any) === 'marquee-select') ? 'none' : 'auto',
      }}
      onClick={handleBgClick}
    >
      {/* Clean Minimized Resize & Move Mode Canvas Indicator */}
      {interactive && isResizeMode && (
        <div
          data-export-ignore="true"
          className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1 bg-gray-900/80 text-white text-[11px] rounded-full shadow-md backdrop-blur-sm pointer-events-auto select-none border border-white/10"
        >
          <Maximize2 className="h-3 w-3 text-blue-400" />
          <span className="font-medium">Resize &amp; Move</span>
          <span className="text-gray-400 text-[10px] hidden sm:inline">• Drag zone to move, edges to resize</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setResizeMode(false)
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Exit Resize Mode"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Render zones in order (background first, then content, then decorations) */}
      {renderedZones
        .filter(rz => (rz.zone as any).visible !== false)
        .sort((a, b) => zoneOrder(a.zone.type) - zoneOrder(b.zone.type))
        .map((rz, idx) => (
          <ZoneView
            key={rz.zone.id || idx}
            renderedZone={rz}
            scale={scale}
            palette={colorPalette}
            canvasWidth={width}
            canvasHeight={height}
            interactive={interactive}
            forceRealChart={forceRealChart}
            zoomLevel={zoomLevel}
            renderLocalCanvas={renderLocalCanvas}
            allObstacles={allObstacles}
          />
        ))}

      {/* Floating toolbar for selected text/stat zone (hidden in resize mode) */}
      {interactive && !isResizeMode && selectedZoneId && (() => {
        const selZone = renderedZones.find(rz => rz.zone.id === selectedZoneId)
        if (!selZone) return null
        const { zone } = selZone
        if (zone.type !== 'text' && zone.type !== 'stat') return null
        if (!zone.position) return null
        return (
          <FormatZoneToolbar
            zoneId={zone.id}
            zoneType={zone.type as 'text' | 'stat'}
            x={zone.position.x}
            y={zone.position.y}
            scale={scale}
          />
        )
      })()}
    </div>
  )
}

/** Render order: background → decoration → chart → text → stat */
function zoneOrder(type: string): number {
  switch (type) {
    case 'background': return 0
    case 'decoration': return 1
    case 'chart': return 2
    case 'image': return 3
    case 'text': return 4
    case 'stat': return 5
    default: return 6
  }
}

// ========================================
// ZONE DISPATCHER
// ========================================

interface ZoneViewProps {
  renderedZone: RenderedZone
  scale: number
  palette: FormatColorPalette
  canvasWidth: number
  canvasHeight: number
  interactive?: boolean
  forceRealChart?: boolean
  zoomLevel?: number
  renderLocalCanvas?: boolean
  allObstacles?: Obstacle[]
}

function ZoneView({
  renderedZone,
  scale,
  palette,
  canvasWidth,
  canvasHeight,
  interactive,
  forceRealChart,
  zoomLevel,
  renderLocalCanvas,
  allObstacles = []
}: ZoneViewProps) {
  const { zone } = renderedZone

  // Background zones don't need position — they fill the canvas
  if (zone.type === 'background') {
    return <BackgroundZoneView renderedZone={renderedZone} scale={scale} canvasWidth={canvasWidth} />
  }

  // Skip zones without position
  const pos = zone.position
  if (!pos) return null

  // Background helper
  const getZoneBackgroundStyle = (): React.CSSProperties => {
    const zStyle: any = (zone as any).style || {}
    const isTrans = zStyle.bgType === 'transparent' || zStyle.backgroundColor === 'transparent' || zStyle.bgColor === 'transparent'
    if (isTrans) return { backgroundColor: 'transparent' }

    const bgType = zStyle.bgType || (zStyle.backgroundColor || zStyle.bgColor ? 'color' : 'transparent')
    if (bgType === 'transparent') return { backgroundColor: 'transparent' }

    const opacity = (zStyle.bgOpacity ?? 100) / 100
    const hexToRgba = (hex: string, op: number) => {
      const h = hex.replace('#', '')
      if (h.length !== 6) return hex
      const r = parseInt(h.substring(0, 2), 16)
      const g = parseInt(h.substring(2, 4), 16)
      const b = parseInt(h.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${op})`
    }

    if (bgType === 'color') {
      return { backgroundColor: hexToRgba(zStyle.backgroundColor || zStyle.bgColor || '#ffffff', opacity) }
    }
    
    if (bgType === 'gradient') {
      const type = zStyle.bgGradientType || 'linear'
      const c1 = hexToRgba(zStyle.bgGradientColor1 || '#ffffff', opacity)
      const c2 = hexToRgba(zStyle.bgGradientColor2 || '#000000', opacity)
      const dir = type === 'linear' ? (zStyle.bgGradientDirection || 'to right') : 'circle'
      return { backgroundImage: type === 'linear' ? `linear-gradient(${dir}, ${c1}, ${c2})` : `radial-gradient(${dir}, ${c1}, ${c2})` }
    }
    
    if (bgType === 'image' && zStyle.bgImageUrl) {
      const proxiedUrl = getProxiedImageUrl(zStyle.bgImageUrl)
      if (opacity < 1) {
        return {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url("${proxiedUrl}")`,
          backgroundSize: zStyle.bgImageFit === 'fill' ? '100% 100%' : (zStyle.bgImageFit || 'cover'),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      }
      return {
        backgroundImage: `url("${proxiedUrl}")`,
        backgroundSize: zStyle.bgImageFit === 'fill' ? '100% 100%' : (zStyle.bgImageFit || 'cover'),
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return {}
  }

  // Positioned zone wrapper
  const style: React.CSSProperties = {
    position: 'absolute',
    left: pos.x * scale,
    top: pos.y * scale,
    width: pos.width * scale,
    height: pos.height * scale,
    overflow: 'hidden',
    ...getZoneBackgroundStyle()
  }

  // Determine the inner content
  let content: React.ReactNode = null
  switch (zone.type) {
    case 'text':
      content = <TextZoneContent renderedZone={renderedZone} scale={scale} interactive={!!interactive} />
      break
    case 'chart':
      content = <ChartZoneView renderedZone={renderedZone} scale={scale} style={{}} palette={palette} interactive={interactive} forceRealChart={forceRealChart} zoomLevel={zoomLevel} renderLocalCanvas={renderLocalCanvas} />
      break
    case 'stat':
      content = <StatZoneContent renderedZone={renderedZone} scale={scale} interactive={!!interactive} />
      break
    case 'decoration':
      content = <DecorationZoneView renderedZone={renderedZone} scale={scale} style={{}} />
      break
    case 'image':
      content = <ImageZoneContent renderedZone={renderedZone} scale={scale} zoneWidth={pos.width} />
      break
    default:
      return null
  }

  // Interactive wrapper
  if (interactive && zone.id) {
    return (
      <InteractiveZoneWrapper
        zoneId={zone.id}
        zoneType={zone.type}
        zoneRole={(zone as any).role}
        zonePosition={pos}
        style={style}
        scale={scale}
        zoomLevel={zoomLevel || scale || 1}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        allObstacles={allObstacles}
      >
        {content}
      </InteractiveZoneWrapper>
    )
  }

  return <div style={style}>{content}</div>
}

// ========================================
// INTERACTIVE ZONE WRAPPER
// ========================================

function InteractiveZoneWrapper({
  zoneId,
  zoneType,
  zoneRole,
  zonePosition,
  style,
  scale,
  zoomLevel,
  canvasWidth,
  canvasHeight,
  allObstacles,
  children
}: {
  zoneId: string
  zoneType: string
  zoneRole?: string
  zonePosition?: { x: number; y: number; width: number; height: number }
  style: React.CSSProperties
  scale: number
  zoomLevel: number
  canvasWidth: number
  canvasHeight: number
  allObstacles: Obstacle[]
  children: React.ReactNode
}) {
  const {
    hoveredZoneId, setHoveredZoneId,
    selectedZoneId, setSelectedZoneId,
    editingZoneId, setEditingZoneId,
    isResizeMode, updateZonePosition
  } = useFormatGalleryStore()

  const isHovered = hoveredZoneId === zoneId
  const isSelected = selectedZoneId === zoneId
  const isEditing = editingZoneId === zoneId
  const isEditable = zoneType === 'text' || zoneType === 'stat'

  // Resizing state
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const dragRef = useRef<{
    startClientX: number
    startClientY: number
    startRect: { x: number; y: number; width: number; height: number }
    handle: string
  } | null>(null)
  const latestRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const latestMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Keep currentRect in sync with incoming zonePosition when not actively dragging
  useEffect(() => {
    if (!dragRef.current && zonePosition) {
      setCurrentRect(zonePosition)
      latestRectRef.current = zonePosition
    }
  }, [zonePosition])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return
    setSelectedZoneId(zoneId)
  }, [zoneId, isEditing, setSelectedZoneId])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing || isResizeMode) return
    if (isEditable) {
      setEditingZoneId(zoneId)
    }
  }, [zoneId, isEditing, isResizeMode, isEditable, setEditingZoneId])

  // Start dragging / moving the zone across free space
  const handleStartMove = useCallback((e: React.MouseEvent) => {
    if (!zonePosition) return
    if (!isResizeMode || isEditing) return
    if (e.button !== 0) return // Only primary mouse button

    e.stopPropagation()
    e.preventDefault()

    setSelectedZoneId(zoneId)
    setActiveHandle('move')
    const baseRect = currentRect || zonePosition
    latestRectRef.current = { ...baseRect }
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { ...baseRect },
      handle: 'move',
    }

    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [zonePosition, isResizeMode, isEditing, zoneId, currentRect, setSelectedZoneId])

  // Start resize from handle or side
  const handleStartResize = useCallback((e: React.MouseEvent, handle: string) => {
    if (!zonePosition) return
    e.stopPropagation()
    e.preventDefault()

    setSelectedZoneId(zoneId)
    setActiveHandle(handle)
    const baseRect = currentRect || zonePosition
    latestRectRef.current = { ...baseRect }
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { ...baseRect },
      handle,
    }

    const cursor = (handle === 'n' || handle === 's') ? 'ns-resize' :
                   (handle === 'e' || handle === 'w') ? 'ew-resize' :
                   (handle === 'nw' || handle === 'se') ? 'nwse-resize' : 'nesw-resize'
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'
  }, [zoneId, zonePosition, currentRect, setSelectedZoneId])

  // Mouse move and mouse up listeners while actively resizing or moving
  useEffect(() => {
    if (!activeHandle) return

    const handleMouseMove = (e: MouseEvent) => {
      latestMousePosRef.current = { clientX: e.clientX, clientY: e.clientY }

      // Throttle coordinate recalculation to the screen's refresh cycle (rAF)
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          const mouse = latestMousePosRef.current
          const drag = dragRef.current
          if (!mouse || !drag) return

          const effectiveZoom = zoomLevel || scale || 1
          const dx = (mouse.clientX - drag.startClientX) / effectiveZoom
          const dy = (mouse.clientY - drag.startClientY) / effectiveZoom

          const otherObstacles = allObstacles.filter(o => o.id !== zoneId)

          // Handle zone translation (drag to move)
          if (drag.handle === 'move') {
            const proposedX = drag.startRect.x + dx
            const proposedY = drag.startRect.y + dy

            const clamped = clampMoveWithCollisions(
              proposedX,
              proposedY,
              drag.startRect.width,
              drag.startRect.height,
              drag.startRect,
              canvasWidth,
              canvasHeight,
              otherObstacles
            )

            latestRectRef.current = clamped
            setCurrentRect(clamped)
            return
          }

          // Handle zone resizing
          let proposedX = drag.startRect.x
          let proposedY = drag.startRect.y
          let proposedW = drag.startRect.width
          let proposedH = drag.startRect.height

          if (drag.handle.includes('e')) {
            proposedW = drag.startRect.width + dx
          }
          if (drag.handle.includes('s')) {
            proposedH = drag.startRect.height + dy
          }
          if (drag.handle.includes('w')) {
            proposedX = drag.startRect.x + dx
            proposedW = drag.startRect.width - dx
          }
          if (drag.handle.includes('n')) {
            proposedY = drag.startRect.y + dy
            proposedH = drag.startRect.height - dy
          }

          const minW = zoneType === 'chart' ? 120 : 40
          const minH = zoneType === 'chart' ? 80 : 30

          const clamped = clampResizeWithCollisions(
            { x: proposedX, y: proposedY, width: proposedW, height: proposedH },
            drag.handle,
            drag.startRect,
            canvasWidth,
            canvasHeight,
            otherObstacles,
            minW,
            minH
          )

          latestRectRef.current = clamped
          setCurrentRect(clamped)
        })
      }
    }

    const handleMouseUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      const mouse = latestMousePosRef.current
      const drag = dragRef.current
      let finalRect = latestRectRef.current

      // Calculate final exact position if mouse moved since last rAF frame
      if (mouse && drag) {
        const effectiveZoom = zoomLevel || scale || 1
        const dx = (mouse.clientX - drag.startClientX) / effectiveZoom
        const dy = (mouse.clientY - drag.startClientY) / effectiveZoom
        const otherObstacles = allObstacles.filter(o => o.id !== zoneId)

        if (drag.handle === 'move') {
          finalRect = clampMoveWithCollisions(
            drag.startRect.x + dx,
            drag.startRect.y + dy,
            drag.startRect.width,
            drag.startRect.height,
            drag.startRect,
            canvasWidth,
            canvasHeight,
            otherObstacles
          )
        } else {
          let proposedX = drag.startRect.x
          let proposedY = drag.startRect.y
          let proposedW = drag.startRect.width
          let proposedH = drag.startRect.height

          if (drag.handle.includes('e')) proposedW = drag.startRect.width + dx
          if (drag.handle.includes('s')) proposedH = drag.startRect.height + dy
          if (drag.handle.includes('w')) {
            proposedX = drag.startRect.x + dx
            proposedW = drag.startRect.width - dx
          }
          if (drag.handle.includes('n')) {
            proposedY = drag.startRect.y + dy
            proposedH = drag.startRect.height - dy
          }

          const minW = zoneType === 'chart' ? 120 : 40
          const minH = zoneType === 'chart' ? 80 : 30

          finalRect = clampResizeWithCollisions(
            { x: proposedX, y: proposedY, width: proposedW, height: proposedH },
            drag.handle,
            drag.startRect,
            canvasWidth,
            canvasHeight,
            otherObstacles,
            minW,
            minH
          )
        }
      }

      // Single commit to global store and persistent storage on release
      if (finalRect && drag) {
        setCurrentRect(finalRect)
        updateZonePosition(zoneId, finalRect)
      }

      dragRef.current = null
      latestMousePosRef.current = null
      setActiveHandle(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [activeHandle, zoomLevel, scale, allObstacles, zoneId, zoneType, canvasWidth, canvasHeight, updateZonePosition])

  // Compute active position if dragging or rect is updated
  const displayRect = currentRect || zonePosition
  const activeStyle: React.CSSProperties = displayRect ? {
    ...style,
    left: displayRect.x * scale,
    top: displayRect.y * scale,
    width: displayRect.width * scale,
    height: displayRect.height * scale,
    willChange: activeHandle ? 'left, top, width, height' : undefined,
  } : style

  // Border and overlay
  let borderOverlay: React.CSSProperties | null = null
  if (isResizeMode) {
    if (isSelected) {
      borderOverlay = {
        border: '2px solid #2563eb',
        boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.25)',
      }
    } else if (isHovered) {
      borderOverlay = {
        border: '2px dashed #60a5fa',
        backgroundColor: 'rgba(59, 130, 246, 0.04)',
      }
    }
  } else {
    if (isSelected) {
      borderOverlay = {
        border: '2px solid #3b82f6',
        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)',
      }
    } else if (isHovered) {
      borderOverlay = {
        border: '2px dashed #f59e0b',
        opacity: 0.85,
      }
    }
  }

  const zoneDisplayName = zoneRole || zoneType

  return (
    <div
      data-zone-wrapper={zoneId}
      style={{
        ...activeStyle,
        overflow: 'visible',
        cursor: isEditing
          ? 'text'
          : isResizeMode
          ? (activeHandle === 'move' ? 'grabbing' : isSelected ? 'grab' : 'pointer')
          : 'pointer',
        zIndex: isSelected ? 40 : isHovered ? 30 : undefined,
      }}
      onMouseEnter={() => setHoveredZoneId(zoneId)}
      onMouseLeave={() => setHoveredZoneId(null)}
      onMouseDown={isResizeMode && !isEditing ? handleStartMove : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Content */}
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: isResizeMode ? 'none' : undefined,
        }}
      >
        {children}
      </div>

      {/* Hover/Select overlay border */}
      {borderOverlay && (
        <div
          className="format-zone-selection-border"
          data-export-ignore="true"
          style={{
            position: 'absolute',
            inset: -2,
            ...borderOverlay,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Standard Zone type label badge (when NOT in resize mode) */}
      {!isResizeMode && (isHovered || isSelected) && !isEditing && (
        <div
          className="format-zone-type-badge"
          data-export-ignore="true"
          style={{
            position: 'absolute',
            top: -18,
            left: 0,
            fontSize: 9,
            fontWeight: 600,
            color: isSelected ? '#3b82f6' : '#f59e0b',
            backgroundColor: isSelected ? '#eff6ff' : '#fffbeb',
            border: `1px solid ${isSelected ? '#bfdbfe' : '#fde68a'}`,
            borderRadius: 3,
            padding: '1px 5px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {zoneDisplayName}
        </div>
      )}

      {/* ═══ RESIZE MODE CONTROLS & SIDE HANDLES ═══ */}
      {isResizeMode && isSelected && displayRect && (
        <div data-export-ignore="true" className="select-none">
          {/* Live Dimension & Move Handle */}
          <div
            className="absolute left-0 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1.5 whitespace-nowrap z-50 uppercase tracking-wide border border-blue-400 cursor-grab active:cursor-grabbing transition-colors pointer-events-auto select-none"
            style={{
              // If zone is near top canvas edge, flip badge inside
              top: displayRect.y < 26 ? 2 : -26,
              left: displayRect.y < 26 ? 2 : 0,
            }}
            onMouseDown={handleStartMove}
            title="Click and drag to move zone within free space"
          >
            <Move className="h-2.5 w-2.5 text-blue-200" />
            <span>{zoneDisplayName}</span>
            <span className="text-blue-300">•</span>
            <span>{Math.round(displayRect.width)} × {Math.round(displayRect.height)} px</span>
          </div>

          {/* Side Grab Strips (full edge proximity) */}
          <div
            className="absolute -top-1.5 left-2 right-2 h-3 cursor-ns-resize z-30"
            onMouseDown={(e) => handleStartResize(e, 'n')}
          />
          <div
            className="absolute -bottom-1.5 left-2 right-2 h-3 cursor-ns-resize z-30"
            onMouseDown={(e) => handleStartResize(e, 's')}
          />
          <div
            className="absolute -left-1.5 top-2 bottom-2 w-3 cursor-ew-resize z-30"
            onMouseDown={(e) => handleStartResize(e, 'w')}
          />
          <div
            className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize z-30"
            onMouseDown={(e) => handleStartResize(e, 'e')}
          />

          {/* 1. TOP SIDE PILL HANDLE */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-9 h-2.5 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-ns-resize z-40 hover:bg-blue-50 hover:scale-110 active:bg-blue-600 transition-all"
            onMouseDown={(e) => handleStartResize(e, 'n')}
            title="Drag side to resize height"
          >
            <div className="w-3.5 h-0.5 bg-blue-500 rounded-full" />
          </div>

          {/* 2. BOTTOM SIDE PILL HANDLE */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-9 h-2.5 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-ns-resize z-40 hover:bg-blue-50 hover:scale-110 active:bg-blue-600 transition-all"
            onMouseDown={(e) => handleStartResize(e, 's')}
            title="Drag side to resize height"
          >
            <div className="w-3.5 h-0.5 bg-blue-500 rounded-full" />
          </div>

          {/* 3. LEFT SIDE PILL HANDLE */}
          <div
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-9 w-2.5 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-ew-resize z-40 hover:bg-blue-50 hover:scale-110 active:bg-blue-600 transition-all"
            onMouseDown={(e) => handleStartResize(e, 'w')}
            title="Drag side to resize width"
          >
            <div className="h-3.5 w-0.5 bg-blue-500 rounded-full" />
          </div>

          {/* 4. RIGHT SIDE PILL HANDLE */}
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-9 w-2.5 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-ew-resize z-40 hover:bg-blue-50 hover:scale-110 active:bg-blue-600 transition-all"
            onMouseDown={(e) => handleStartResize(e, 'e')}
            title="Drag side to resize width"
          >
            <div className="h-3.5 w-0.5 bg-blue-500 rounded-full" />
          </div>

          {/* CORNER HANDLES */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nwse-resize z-40 hover:bg-blue-100"
            onMouseDown={(e) => handleStartResize(e, 'nw')}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nesw-resize z-40 hover:bg-blue-100"
            onMouseDown={(e) => handleStartResize(e, 'ne')}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nesw-resize z-40 hover:bg-blue-100"
            onMouseDown={(e) => handleStartResize(e, 'sw')}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs shadow cursor-nwse-resize z-40 hover:bg-blue-100"
            onMouseDown={(e) => handleStartResize(e, 'se')}
          />
        </div>
      )}
    </div>
  )
}

// ========================================
// TEXT ZONE (with inline editing support)
// ========================================

function TextZoneContent({ renderedZone, scale, interactive }: {
  renderedZone: RenderedZone
  scale: number
  interactive: boolean
}) {
  const zone = renderedZone.zone as TextZone
  const textRef = useRef<HTMLDivElement>(null)
  const wasEditingRef = useRef(false)

  const {
    editingZoneId, setEditingZoneId,
    contentPackage, setContentPackage
  } = useFormatGalleryStore()

  const isEditing = interactive && editingZoneId === zone.id

  // Read content from contentPackage directly (reactive) or fallback to resolvedContent
  const text = useMemo(() => {
    if (contentPackage) {
      if (zone.id && (contentPackage as any)[zone.id] !== undefined) {
        return String((contentPackage as any)[zone.id])
      }
      if (zone.role && (contentPackage as any)[zone.role] !== undefined) {
        return String((contentPackage as any)[zone.role])
      }
    }
    return renderedZone.resolvedContent || ''
  }, [contentPackage, zone.id, zone.role, renderedZone.resolvedContent])

  // Save content when editing stops (isEditing transitions true → false)
  // This replaces onBlur entirely — no more focus-related bugs
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      // Just transitioned from editing → not editing
      // Content was already saved by whoever called setEditingZoneId(null)
      // But let's save innerHTML as a safety measure
      if (textRef.current && contentPackage) {
        const currentHtml = textRef.current.innerHTML || ''
        const key = zone.id || zone.role
        // Only save if content actually changed
        const existing = (contentPackage as any)[key]
        if (currentHtml !== existing) {
          setContentPackage({ ...contentPackage, [key]: currentHtml })
        }
      }
    }
    wasEditingRef.current = isEditing
  }, [isEditing, contentPackage, zone.id, zone.role, setContentPackage])

  // Focus when entering edit mode — set innerHTML via ref
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.innerHTML = text
      textRef.current.focus()
      // Place cursor at the end
      const range = document.createRange()
      range.selectNodeContents(textRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing]) // intentionally only depend on isEditing

  // Sync content while typing/formatting (captures execCommand and keystrokes instantly)
  const handleInput = useCallback(() => {
    if (!textRef.current || !contentPackage) return
    const currentHtml = textRef.current.innerHTML || ''
    const key = zone.id || zone.role
    
    // Check if changed to avoid unnecessary store updates
    const existing = (contentPackage as any)[key]
    if (currentHtml !== existing) {
      setContentPackage({ ...contentPackage, [key]: currentHtml })
    }
  }, [contentPackage, setContentPackage, zone.id, zone.role])

  // Explicit save + exit function (for Escape key and toolbar actions)
  const saveAndExit = useCallback(() => {
    if (textRef.current && contentPackage) {
      const newHtml = textRef.current.innerHTML || ''
      const key = zone.id || zone.role
      setContentPackage({ ...contentPackage, [key]: newHtml })
    }
    setEditingZoneId(null)
  }, [contentPackage, setContentPackage, zone.id, zone.role, setEditingZoneId])

  if (!text && !isEditing) return null

  // Check if content has HTML tags (lists, etc.)
  const hasHtml = /<[a-z][\s\S]*>/i.test(text)

  const textStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    padding: `${4 * scale}px`,
    boxSizing: 'border-box', // Crucial for html2canvas to not overflow with padding
    fontFamily: zone.style.fontFamily || 'Inter, sans-serif',
    fontSize: `${zone.style.fontSize * scale}px`,
    fontWeight: zone.style.fontWeight || '400',
    color: zone.style.color || '#1a1a2e',
    textAlign: zone.style.textAlign || 'left',
    lineHeight: zone.style.lineHeight || 1.6,
    letterSpacing: zone.style.letterSpacing ? `${zone.style.letterSpacing}px` : undefined,
    fontStyle: zone.style.fontStyle || 'normal',
    textTransform: zone.style.textTransform || 'none',
    textDecoration: zone.style.textDecoration || 'none',
    wordBreak: 'break-word',
    outline: 'none',
    cursor: isEditing ? 'text' : 'inherit',
    overflow: 'hidden',
  }

  return (
    <div
      ref={textRef}
      className="format-text-zone html-content-area"
      style={textStyle}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={isEditing ? handleInput : undefined}
      onKeyDown={isEditing ? (e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          saveAndExit()
        }
      } : undefined}
      {...(!isEditing && hasHtml ? { dangerouslySetInnerHTML: { __html: sanitizeHTML(text) } } : {})}
    >
      {isEditing ? undefined : (!hasHtml ? text : undefined)}
    </div>
  )
}

// ========================================
// STAT ZONE (with inline editing support)
// ========================================

function StatZoneContent({ renderedZone, scale, interactive }: {
  renderedZone: RenderedZone
  scale: number
  interactive: boolean
}) {
  const zone = renderedZone.zone as StatZone
  const value = renderedZone.resolvedValue || '—'
  const label = renderedZone.resolvedLabel || ''
  const layout = zone.style.layout || 'vertical'

  const {
    editingZoneId, setEditingZoneId,
    contentPackage, setContentPackage
  } = useFormatGalleryStore()

  const isEditing = interactive && editingZoneId === zone.id
  const valueRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  // Get stat index for this zone
  const getStatIndex = (role: string) => {
    switch(role) {
      case 'highlight': return 0
      case 'secondary': return 1
      case 'tertiary': return 2
      default: return 0
    }
  }

  const handleValueBlur = useCallback(() => {
    if (!valueRef.current || !contentPackage) return
    const stats = [...(contentPackage.stats || [])]
    const idx = getStatIndex(zone.role)
    while (stats.length <= idx) stats.push({ value: '', label: '' })
    stats[idx] = { ...stats[idx], value: valueRef.current.textContent || '' }
    setContentPackage({ ...contentPackage, stats })
  }, [contentPackage, setContentPackage, zone.role])

  const handleLabelBlur = useCallback(() => {
    if (!labelRef.current || !contentPackage) return
    const stats = [...(contentPackage.stats || [])]
    const idx = getStatIndex(zone.role)
    while (stats.length <= idx) stats.push({ value: '', label: '' })
    stats[idx] = { ...stats[idx], label: labelRef.current.textContent || '' }
    setContentPackage({ ...contentPackage, stats })
  }, [contentPackage, setContentPackage, zone.role])

  // Focus value when entering edit mode
  useEffect(() => {
    if (isEditing && valueRef.current) {
      valueRef.current.focus()
    }
  }, [isEditing])

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: layout === 'vertical' ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${2 * scale}px`,
    padding: `${4 * scale}px`,
    textAlign: zone.style.textAlign || 'center',
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingZoneId(null)
    }
  }

  return (
    <div style={containerStyle}>
      <span
        ref={valueRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={isEditing ? handleValueBlur : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        style={{
          fontSize: `${zone.style.valueSize * scale}px`,
          fontWeight: zone.style.valueFontWeight || '800',
          fontFamily: zone.style.valueFontFamily || 'Inter, sans-serif',
          fontStyle: zone.style.valueFontStyle || 'normal',
          textDecoration: zone.style.valueTextDecoration || 'none',
          color: zone.style.valueColor || '#1a1a2e',
          lineHeight: 1.1,
          outline: 'none',
          cursor: isEditing ? 'text' : 'inherit',
          minWidth: isEditing ? '20px' : undefined,
        }}
      >
        {value}
      </span>
      {(label || isEditing) && (
        <span
          ref={labelRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={isEditing ? handleLabelBlur : undefined}
          onKeyDown={isEditing ? handleKeyDown : undefined}
          style={{
            fontSize: `${zone.style.labelSize * scale}px`,
            fontFamily: zone.style.labelFontFamily || 'Inter, sans-serif',
            color: zone.style.labelColor || '#6b7280',
            lineHeight: 1.2,
            textAlign: 'center',
            outline: 'none',
            cursor: isEditing ? 'text' : 'inherit',
            minWidth: isEditing ? '20px' : undefined,
          }}
        >
          {label || 'Label'}
        </span>
      )}
    </div>
  )
}

// ========================================
// CHART ZONE (simplified preview — colored placeholder)
// ========================================

// ========================================

function ChartZoneView({
  renderedZone,
  scale,
  style,
  palette,
  interactive,
  forceRealChart,
  zoomLevel = 1,
  renderLocalCanvas = false,
}: {
  renderedZone: RenderedZone
  scale: number
  style: React.CSSProperties
  palette: FormatColorPalette
  interactive?: boolean
  forceRealChart?: boolean
  zoomLevel?: number
  renderLocalCanvas?: boolean
}) {
  const chartType = renderedZone.resolvedChartType || 'bar'
  const data = renderedZone.resolvedChartData
  const config = renderedZone.resolvedChartConfig
  const zoneWidth = renderedZone.zone.position?.width || 800
  const zoneHeight = renderedZone.zone.position?.height || 600

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: `${2 * scale}px`,
    padding: `${6 * scale}px`,
    overflow: 'hidden',
  }

  // Render the full ChartGenerator with override props — gives exact fidelity
  if (renderLocalCanvas) {
    return (
      <div style={{ ...containerStyle, padding: 0 }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ChartGenerator
            readOnly
            dataOverride={data}
            configOverride={config}
            typeOverride={chartType}
            isTemplateOrFormat={true}
            responsiveWidth={zoneWidth}
            responsiveHeight={zoneHeight}
          />
        </div>
      </div>
    )
  }

  // Interactive mode renders the actual Chart.js chart (from global store)
  if (interactive || forceRealChart) {
    return (
      <div style={{ ...containerStyle, padding: 0 }}>
        {/* We use pointer-events-none on the wrapper to let FormatRenderer handle clicks, 
            or remove it if we want tooltips to work */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ChartGenerator
            devicePixelRatioMultiplier={Math.max(1, zoomLevel)}
            responsiveWidth={zoneWidth}
            responsiveHeight={zoneHeight}
          />
        </div>
      </div>
    )
  }

  // Render mini bar chart preview
  if (['bar', 'bar3d', 'horizontalBar'].includes(chartType) && data?.datasets?.[0]?.data) {
    const values = data.datasets[0].data.slice(0, 8) as number[]
    const max = Math.max(...values, 1)

    return (
      <div style={containerStyle}>
        {values.map((v: number, i: number) => (
          <div
            key={i}
            style={{
              flex: 1,
              maxWidth: `${20 * scale}px`,
              height: `${(v / max) * 90}%`,
              minHeight: `${3 * scale}px`,
              backgroundColor: palette.chartColors
                ? palette.chartColors[i % palette.chartColors.length]
                : [palette.primary, palette.secondary, palette.accent][i % 3],
              borderRadius: `${2 * scale}px ${2 * scale}px 0 0`,
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>
    )
  }

  // Render mini pie chart preview
  if (['pie', 'doughnut', 'pie3d', 'doughnut3d'].includes(chartType) && data?.datasets?.[0]?.data) {
    const values = data.datasets[0].data.slice(0, 6) as number[]
    const total = values.reduce((a: number, b: number) => a + b, 0) || 1
    const colors = palette.chartColors || [palette.primary, palette.secondary, palette.accent, '#6366f1', '#ec4899', '#f59e0b']

    // Build conic gradient
    let gradientStops = ''
    let cumulative = 0
    values.forEach((v: number, i: number) => {
      const start = (cumulative / total) * 360
      cumulative += v
      const end = (cumulative / total) * 360
      gradientStops += `${colors[i % colors.length]} ${start}deg ${end}deg, `
    })
    gradientStops = gradientStops.slice(0, -2)

    const w = 200 * scale
    const h = 200 * scale
    const size = Math.min(w, h) * 0.7
    const isDoughnut = chartType.includes('doughnut')

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `conic-gradient(${gradientStops})`,
            position: 'relative',
          }}
        >
          {isDoughnut && (
            <div
              style={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                width: '50%',
                height: '50%',
                borderRadius: '50%',
                backgroundColor: palette.background || '#fff',
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Render mini line chart preview
  if (['line', 'area'].includes(chartType) && data?.datasets?.[0]?.data) {
    const values = data.datasets[0].data.slice(0, 10) as number[]
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = max - min || 1
    const w = 200 * scale
    const h = 200 * scale
    const padding = 6 * scale

    const points = values.map((v: number, i: number) => ({
      x: padding + (i / Math.max(values.length - 1, 1)) * (w - 2 * padding),
      y: padding + (1 - (v - min) / range) * (h - 2 * padding),
    }))

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {chartType === 'area' && (
            <path d={areaD} fill={palette.primary} opacity="0.15" />
          )}
          <path
            d={pathD}
            stroke={palette.primary}
            strokeWidth={2 * scale}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2 * scale} fill={palette.primary} />
          ))}
        </svg>
      </div>
    )
  }

  // Fallback: generic chart placeholder
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: `${3 * scale}px`,
      }}
    >
      <span style={{ fontSize: `${14 * scale}px`, color: '#93a3b8' }}>📊</span>
    </div>
  )
}

// ========================================
// BACKGROUND ZONE
// ========================================

function BackgroundZoneView({ renderedZone, scale, canvasWidth }: {
  renderedZone: RenderedZone
  scale: number
  canvasWidth?: number
}) {
  const zone = renderedZone.zone as BackgroundZone

  const bgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
  }

  // Image background
  const isImageBg = zone.style.type === 'image' || (zone.style as any)?.bgType === 'image'
  const rawBgUrl = renderedZone.resolvedImageUrl || zone.style.imageUrl || (zone.style as any)?.bgImageUrl || (zone as any)?.imageUrl
  if (isImageBg && rawBgUrl) {
    const imageWidth = canvasWidth ? Math.round(canvasWidth * scale) : undefined
    const imageUrl = getProxiedImageUrl(rawBgUrl, imageWidth ? { width: imageWidth, format: 'webp' } : undefined)
    
    const isBaseTrans = (zone.style as any)?.baseColorType === 'transparent' ||
      (zone.style as any)?.baseColor === 'transparent' ||
      (zone.style as any)?.backgroundColor === 'transparent'
    
    const baseColor = isBaseTrans
      ? 'transparent'
      : ((zone.style as any)?.baseColor || (zone.style as any)?.backgroundColor || '#ffffff')

    return (
      <div style={{ ...bgStyle, backgroundColor: baseColor }}>
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: (zone.style.imageFit as any) || 'cover',
            opacity: (zone.style as any)?.imageOpacity !== undefined ? (zone.style as any).imageOpacity / 100 : ((zone.style as any)?.opacity !== undefined ? (zone.style as any).opacity : 1),
            filter: ((zone.style as any)?.imageBlur || (zone.style as any)?.blur) ? `blur(${(zone.style as any).imageBlur || (zone.style as any).blur}px)` : undefined,
          }}
        />
        {zone.style.overlay && (
          <div style={{ ...bgStyle, backgroundColor: zone.style.overlay }} />
        )}
      </div>
    )
  }

  // Gradient background
  if (zone.style.type === 'gradient' && renderedZone.resolvedGradient) {
    return (
      <div
        style={{
          ...bgStyle,
          background: renderedZone.resolvedGradient,
        }}
      />
    )
  }

  // Fallback from zone style
  if (zone.style.type === 'solid' && zone.style.color) {
    return <div style={{ ...bgStyle, backgroundColor: zone.style.color }} />
  }

  if (zone.style.type === 'gradient' && zone.style.gradientColor1) {
    const dir = zone.style.gradientDirection || '135deg'
    return (
      <div
        style={{
          ...bgStyle,
          background: `linear-gradient(${dir}, ${zone.style.gradientColor1}, ${zone.style.gradientColor2 || zone.style.gradientColor1})`,
        }}
      />
    )
  }

  // Pattern background
  if (zone.style.type === 'pattern') {
    const color = zone.style.patternColor || '#e2e8f0'
    const opacity = zone.style.patternOpacity || 0.3
    const patternType = zone.style.patternType || 'dots'
    const { backgroundImage, backgroundSize, backgroundRepeat } = getPatternCSS(patternType, color, scale)
    return (
      <div
        style={{
          ...bgStyle,
          backgroundColor: zone.style.color || '#ffffff',
          backgroundImage,
          backgroundSize,
          backgroundRepeat,
          opacity,
        }}
      />
    )
  }

  return null
}

// ========================================
// DECORATION ZONE
// ========================================

function DecorationZoneView({ renderedZone, scale, style }: {
  renderedZone: RenderedZone
  scale: number
  style: React.CSSProperties
}) {
  const zone = renderedZone.zone as DecorationZone

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    ...style,
  }

  // SVG decoration
  if (zone.subtype === 'svg-icon' && renderedZone.resolvedSvg) {
    return (
      <div
        style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: zone.style.svgOpacity || 0.6,
          color: zone.style.svgColor || '#6b7280',
        }}
        dangerouslySetInnerHTML={{ __html: sanitizeSVG(renderedZone.resolvedSvg) }}
      />
    )
  }

  // Border decoration
  if (zone.subtype === 'border') {
    return (
      <div
        style={{
          ...baseStyle,
          border: `${(zone.style.borderWidth || 1) * scale}px ${zone.style.borderStyle || 'solid'} ${zone.style.borderColor || '#e5e7eb'}`,
          borderRadius: zone.style.borderRadius ? `${zone.style.borderRadius * scale}px` : undefined,
          pointerEvents: 'none',
        }}
      />
    )
  }

  // Divider decoration
  if (zone.subtype === 'divider') {
    return (
      <div
        style={{
          ...baseStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${(zone.style.dividerThickness || 2) * scale}px`,
            backgroundColor: zone.style.dividerColor || '#e5e7eb',
            borderRadius: `${scale}px`,
          }}
        />
      </div>
    )
  }

  // Shape decoration (circle, rectangle, etc.)
  if (zone.subtype === 'shape') {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: zone.style.shapeColor || '#e5e7eb',
          opacity: zone.style.shapeOpacity || 0.3,
          borderRadius: zone.style.shapeType === 'circle' ? '50%' : undefined,
        }}
      />
    )
  }

  return null
}

// ========================================
// IMAGE ZONE
// ========================================

function ImageZoneContent({ renderedZone, scale, zoneWidth }: {
  renderedZone: RenderedZone
  scale: number
  zoneWidth: number
}) {
  const zone = renderedZone.zone as ImageZone
  const rawUrl = renderedZone.resolvedImageUrl || zone.imageUrl || (zone.style as any)?.imageUrl || (zone.style as any)?.bgImageUrl || (zone as any)?.url
  
  const reqWidth = Math.round(zoneWidth * scale)
  const imageUrl = rawUrl ? getProxiedImageUrl(rawUrl, { width: reqWidth, format: 'webp' }) : ''

  const isTransparent = (zone.style as any)?.bgType === 'transparent' ||
    zone.style?.backgroundColor === 'transparent' ||
    (zone.style as any)?.bgColor === 'transparent'

  const bgColor = isTransparent
    ? 'transparent'
    : (zone.style?.backgroundColor || (zone.style as any)?.bgColor || 'transparent')

  if (!imageUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isTransparent ? 'transparent' : (zone.style?.backgroundColor || '#1e293b'),
          borderRadius: zone.style?.borderRadius ? `${zone.style.borderRadius * scale}px` : undefined,
          border: `${1 * scale}px dashed rgba(255, 255, 255, 0.2)`,
        }}
      >
        <span style={{ fontSize: `${14 * scale}px`, opacity: 0.4 }}>🖼️</span>
      </div>
    )
  }

  const opacity = (zone.style as any)?.imageOpacity !== undefined
    ? (zone.style as any).imageOpacity / 100
    : (zone.style as any)?.opacity !== undefined
      ? ((zone.style as any).opacity > 1 ? (zone.style as any).opacity / 100 : (zone.style as any).opacity)
      : 1
  const blurVal = (zone.style as any)?.imageBlur || (zone.style as any)?.blur || 0

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: zone.style?.borderRadius ? `${zone.style.borderRadius * scale}px` : undefined,
        backgroundColor: bgColor,
      }}
    >
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: (zone.style?.imageFit as any) || 'cover',
          opacity,
          filter: blurVal ? `blur(${blurVal}px)` : undefined,
          transition: 'all 0.15s ease-out',
        }}
      />
    </div>
  )
}
