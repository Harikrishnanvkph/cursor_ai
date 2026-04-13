"use client"

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
  FormatColorPalette,
} from "@/lib/format-types"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { FormatZoneToolbar } from "@/components/format/FormatZoneToolbar"
import { getPatternCSS } from "@/lib/utils"

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
}

export function FormatRenderer({
  rendered,
  scale = 1,
  className = "",
  interactive = false,
  panMode = false,
}: FormatRendererProps) {
  const { skeleton, renderedZones, colorPalette } = rendered
  const { width, height } = skeleton.dimensions
  const { selectedZoneId, setSelectedZoneId, setEditingZoneId } = useFormatGalleryStore()
  const { setSelectedShapeId } = useDecorationStore()

  const scaledW = width * scale
  const scaledH = height * scale

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
        pointerEvents: panMode ? 'none' : 'auto',
      }}
      onClick={handleBgClick}
    >
      {/* Render zones in order (background first, then content, then decorations) */}
      {renderedZones
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
          />
        ))}

      {/* Floating toolbar for selected text/stat zone */}
      {interactive && selectedZoneId && (() => {
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
    case 'text': return 3
    case 'stat': return 4
    default: return 5
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
}

function ZoneView({ renderedZone, scale, palette, canvasWidth, canvasHeight, interactive }: ZoneViewProps) {
  const { zone } = renderedZone

  // Background zones don't need position — they fill the canvas
  if (zone.type === 'background') {
    return <BackgroundZoneView renderedZone={renderedZone} scale={scale} />
  }

  // Skip zones without position
  const pos = zone.position
  if (!pos) return null

  // Background helper
  const getZoneBackgroundStyle = (): React.CSSProperties => {
    const zStyle: any = (zone as any).style || {}
    const bgType = zStyle.bgType || (zStyle.backgroundColor || zStyle.bgColor ? 'color' : 'transparent')
    if (bgType === 'transparent') return {}

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
      if (opacity < 1) {
        return {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${zStyle.bgImageUrl})`,
          backgroundSize: zStyle.bgImageFit === 'fill' ? '100% 100%' : (zStyle.bgImageFit || 'cover'),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      }
      return {
        backgroundImage: `url("${zStyle.bgImageUrl}")`,
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
      content = <ChartZoneView renderedZone={renderedZone} scale={scale} style={{}} palette={palette} interactive={interactive} />
      break
    case 'stat':
      content = <StatZoneContent renderedZone={renderedZone} scale={scale} interactive={!!interactive} />
      break
    case 'decoration':
      content = <DecorationZoneView renderedZone={renderedZone} scale={scale} style={{}} />
      break
    default:
      return null
  }

  // Interactive wrapper
  if (interactive && zone.id) {
    return (
      <InteractiveZoneWrapper zoneId={zone.id} zoneType={zone.type} style={style} scale={scale}>
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
  style,
  scale,
  children
}: {
  zoneId: string
  zoneType: string
  style: React.CSSProperties
  scale: number
  children: React.ReactNode
}) {
  const {
    hoveredZoneId, setHoveredZoneId,
    selectedZoneId, setSelectedZoneId,
    editingZoneId, setEditingZoneId
  } = useFormatGalleryStore()

  const isHovered = hoveredZoneId === zoneId
  const isSelected = selectedZoneId === zoneId
  const isEditing = editingZoneId === zoneId
  const isEditable = zoneType === 'text' || zoneType === 'stat'

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // When editing, do NOTHING — let the contentEditable handle clicks naturally
    if (isEditing) return
    setSelectedZoneId(zoneId)
  }, [zoneId, isEditing, setSelectedZoneId])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // When already editing, do NOTHING
    if (isEditing) return
    if (isEditable) {
      setEditingZoneId(zoneId)
    }
  }, [zoneId, isEditing, isEditable, setEditingZoneId])

  // Build border style for hover/select
  let borderOverlay: React.CSSProperties | null = null
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

  return (
    <div
      data-zone-wrapper={zoneId}
      style={{
        ...style,
        overflow: 'visible',
        cursor: isEditing ? 'text' : 'pointer',
        zIndex: isSelected ? 30 : isHovered ? 25 : undefined,
      }}
      onMouseEnter={() => setHoveredZoneId(zoneId)}
      onMouseLeave={() => setHoveredZoneId(null)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Content */}
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* Hover/Select overlay border */}
      {borderOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            ...borderOverlay,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Zone type label badge on hover/select */}
      {(isHovered || isSelected) && !isEditing && (
        <div
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
          {zoneType}
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
    if (contentPackage && zone.role && (contentPackage as any)[zone.role] !== undefined) {
      return String((contentPackage as any)[zone.role])
    }
    return renderedZone.resolvedContent || ''
  }, [contentPackage, zone.role, renderedZone.resolvedContent])

  // Save content when editing stops (isEditing transitions true → false)
  // This replaces onBlur entirely — no more focus-related bugs
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      // Just transitioned from editing → not editing
      // Content was already saved by whoever called setEditingZoneId(null)
      // But let's save innerHTML as a safety measure
      if (textRef.current && contentPackage) {
        const currentHtml = textRef.current.innerHTML || ''
        // Only save if content actually changed
        const existing = (contentPackage as any)[zone.role]
        if (currentHtml !== existing) {
          setContentPackage({ ...contentPackage, [zone.role]: currentHtml })
        }
      }
    }
    wasEditingRef.current = isEditing
  }, [isEditing, contentPackage, zone.role, setContentPackage])

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
    
    // Check if changed to avoid unnecessary store updates
    const existing = (contentPackage as any)[zone.role]
    if (currentHtml !== existing) {
      setContentPackage({ ...contentPackage, [zone.role]: currentHtml })
    }
  }, [contentPackage, setContentPackage, zone.role])

  // Explicit save + exit function (for Escape key and toolbar actions)
  const saveAndExit = useCallback(() => {
    if (textRef.current && contentPackage) {
      const newHtml = textRef.current.innerHTML || ''
      setContentPackage({ ...contentPackage, [zone.role]: newHtml })
    }
    setEditingZoneId(null)
  }, [contentPackage, setContentPackage, zone.role, setEditingZoneId])

  if (!text && !isEditing) return null

  // Check if content has HTML tags (lists, etc.)
  const hasHtml = /<[a-z][\s\S]*>/i.test(text)

  const textStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    padding: `${4 * scale}px`,
    fontFamily: zone.style.fontFamily || 'Inter, sans-serif',
    fontSize: `${zone.style.fontSize * scale}px`,
    fontWeight: zone.style.fontWeight || '400',
    color: zone.style.color || '#1a1a2e',
    textAlign: zone.style.textAlign || 'left',
    lineHeight: zone.style.lineHeight || 1.3,
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
    <>
      {/* Inline styles for lists inside this zone */}
      <style>{`
        .format-text-zone ul { list-style-type: disc; padding-left: ${16 * scale}px; margin: ${2 * scale}px 0; }
        .format-text-zone ol { list-style-type: decimal; padding-left: ${16 * scale}px; margin: ${2 * scale}px 0; }
        .format-text-zone li { margin-bottom: ${1 * scale}px; }
      `}</style>
      <div
        ref={textRef}
        className="format-text-zone"
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
        {...(!isEditing && hasHtml ? { dangerouslySetInnerHTML: { __html: text } } : {})}
      >
        {isEditing ? undefined : (!hasHtml ? text : undefined)}
      </div>
    </>
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

import { ChartGenerator } from "@/lib/chart_generator"

function ChartZoneView({ renderedZone, scale, style, palette, interactive }: {
  renderedZone: RenderedZone
  scale: number
  style: React.CSSProperties
  palette: FormatColorPalette
  interactive?: boolean
}) {
  const chartType = renderedZone.resolvedChartType || 'bar'
  const data = renderedZone.resolvedChartData

  // For preview we render a simplified chart representation
  // Full Chart.js rendering is too heavy for gallery thumbnails
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

  // Interactive mode renders the actual Chart.js chart
  if (interactive) {
    return (
      <div style={{ ...containerStyle, padding: 0 }}>
        {/* We use pointer-events-none on the wrapper to let FormatRenderer handle clicks, 
            or remove it if we want tooltips to work */}
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ChartGenerator />
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

function BackgroundZoneView({ renderedZone, scale }: {
  renderedZone: RenderedZone
  scale: number
}) {
  const zone = renderedZone.zone as BackgroundZone

  const bgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
  }

  // Image background
  if (zone.style.type === 'image' && (renderedZone.resolvedImageUrl || zone.style.imageUrl)) {
    const imageUrl = renderedZone.resolvedImageUrl || zone.style.imageUrl
    return (
      <div style={bgStyle}>
        <img
          src={imageUrl}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: (zone.style.imageFit as any) || 'cover',
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
        dangerouslySetInnerHTML={{ __html: renderedZone.resolvedSvg }}
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
