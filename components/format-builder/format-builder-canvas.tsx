"use client"

import React from 'react'
import DraggableResizable from '@/components/reusable/DraggableResizable'
import { MessageSquare } from 'lucide-react'
import { useFormatBuilder } from './format-builder-context'
import { ZONE_COLORS, getZoneLabel } from './format-builder-utils'
import type { FormatZone, BaseZone } from '@/lib/format-types'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { DecorationShapeRenderer } from '@/components/decorations/DecorationShapeRenderer'

function DecorationStoreSync({ skeleton, setSkeleton }: { skeleton: any, setSkeleton: any }) {
  const shapes = useDecorationStore(s => s.shapes)
  const isInitialized = React.useRef(false)
  const previousShapes = React.useRef<any[]>([])

  React.useEffect(() => {
    if (!isInitialized.current && skeleton) {
      // Backup the shapes that were in the store (e.g. from the template editor)
      previousShapes.current = useDecorationStore.getState().shapes
      useDecorationStore.setState({ shapes: skeleton.decorations || [], drawingMode: null })
      isInitialized.current = true
    }
  }, [skeleton])

  React.useEffect(() => {
    // On unmount, restore the shapes back to the store so the editor is unaffected
    return () => {
      useDecorationStore.setState({ shapes: previousShapes.current, drawingMode: null })
    }
  }, [])

  React.useEffect(() => {
    if (!isInitialized.current) return
    setSkeleton((prev: any) => ({ ...prev, decorations: shapes }))
  }, [shapes, setSkeleton])

  return null
}

export function FormatBuilderCanvas() {
  const {
    skeleton, selectedZoneId, setSelectedZoneId,
    zoom, showGuides, gridSize,
    updateZonePosition, setSkeleton
  } = useFormatBuilder()

  const { setSelectedShapeId } = useDecorationStore()

  const dims = skeleton.dimensions
  const palette = skeleton.colorPalette
  const scale = zoom
  const bounds = { width: dims.width, height: dims.height }

  return (
    <>
      <DecorationStoreSync skeleton={skeleton} setSkeleton={setSkeleton} />
      <div
        className="flex-1 overflow-auto p-6"
        onClick={(e) => { 
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-container')) {
            setSelectedZoneId(null); setSelectedShapeId(null) 
          }
        }}
      >
        <div
          className="relative mx-auto canvas-container"
          style={{ width: dims.width * scale, height: dims.height * scale }}
        >
          {/* Scaled surface */}
          <div
            className="absolute inset-0 origin-top-left rounded-lg shadow-2xl"
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >

          {/* Background fill */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: palette.background || '#0f172a' }}
          />

          {/* Render zones — non-positioned zones (like background) render as full canvas */}
          {skeleton.zones
            .filter(z => !z.position && z.type === 'background')
            .map(zone => (
              <div
                key={zone.id}
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={getBackgroundCSS((zone as any).style || {})}
              />
            ))
          }

          {/* Grid overlay — rendered AFTER background so it's visible on top */}
          {showGuides && gridSize > 0 && (
            <div
              className="absolute inset-0 pointer-events-none rounded-lg z-[1]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.12) ${1/scale}px, transparent ${1/scale}px), linear-gradient(90deg, rgba(255,255,255,0.12) ${1/scale}px, transparent ${1/scale}px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
            />
          )}

          {/* Center crosshair guides */}
          {showGuides && (
            <>
              <div className="absolute left-1/2 top-0 bottom-0 pointer-events-none z-[1]" style={{ width: `${1/scale}px`, background: 'rgba(255,255,255,0.2)' }} />
              <div className="absolute top-1/2 left-0 right-0 pointer-events-none z-[1]" style={{ height: `${1/scale}px`, background: 'rgba(255,255,255,0.2)' }} />
            </>
          )}

          {/* Render positioned content zones with DraggableResizable */}
          {skeleton.zones
            .filter(z => z.position && z.type !== 'decoration')
            .map(zone => {
              const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.text
              const isSelected = selectedZoneId === zone.id

              return (
                <DraggableResizable
                  key={zone.id}
                  x={zone.position!.x}
                  y={zone.position!.y}
                  width={zone.position!.width}
                  height={zone.position!.height}
                  bounds={bounds}
                  grid={gridSize}
                  scale={scale}
                  selected={isSelected}
                  onSelect={() => { setSelectedZoneId(zone.id); setSelectedDecoId(null) }}
                  onChange={(rect) => updateZonePosition(zone.id, rect)}
                  label={getZoneLabel(zone)}
                  accentColor={colors.accent}
                >
                  <ZoneVisualContent zone={zone} isSelected={isSelected} onClick={() => { setSelectedZoneId(zone.id); setSelectedShapeId(null) }} />
                </DraggableResizable>
              )
            })}

          {/* ═══ DECORATION LAYER ═══ */}
          <DecorationShapeRenderer
            containerWidth={dims.width}
            containerHeight={dims.height}
            panMode={false}
            gridSize={gridSize}
          />

          {/* Dimension label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 font-mono whitespace-nowrap pointer-events-none">
            {dims.width} × {dims.height} px ({dims.aspect})
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════
// Zone Visual Content — renders actual visual previews
// ═══════════════════════════════════════════════════════

function ZoneVisualContent({ zone, isSelected, onClick }: {
  zone: FormatZone; isSelected: boolean; onClick: () => void
}) {
  const s = (zone as any).style || {}
  const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.text

  // ─── BACKGROUND: render gradient/solid/pattern preview ───
  if (zone.type === 'background') {
    return (
      <div
        className="w-full h-full relative overflow-hidden rounded"
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          ...getBackgroundCSS(s),
          border: isSelected
            ? `2px solid ${colors.accent}`
            : `1px dashed ${colors.border}30`,
        }}
      >
        <ZoneLabel label="background" color={colors.accent} message={(zone as BaseZone).message} />
      </div>
    )
  }

  // ─── TEXT: show styled text placeholder ───
  if (zone.type === 'text') {
    const role = (zone as any).role || 'body'
    return (
      <div
        className="w-full h-full flex items-center overflow-hidden"
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          background: isSelected ? colors.bg : 'transparent',
          border: isSelected
            ? `2px solid ${colors.accent}`
            : `1px dashed ${colors.border}40`,
          padding: '4px 8px',
          fontFamily: s.fontFamily || 'Inter, sans-serif',
          fontSize: `${Math.min(s.fontSize || 16, 36)}px`,
          fontWeight: s.fontWeight || '400',
          color: s.color || '#ffffff',
          textAlign: s.textAlign || 'left',
          lineHeight: s.lineHeight || 1.3,
          letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
          textTransform: s.textTransform || 'none',
          opacity: 0.7,
        }}
      >
        <span className="w-full truncate pointer-events-none select-none">
          {role === 'title' ? 'Title Text Here' :
           role === 'subtitle' ? 'Subtitle goes here' :
           role === 'source' ? 'Source: Data Attribution' :
           role === 'callout' ? '★ Key callout text' :
           'Body text paragraph content'}
        </span>
      </div>
    )
  }

  // ─── STAT: show value + label preview ───
  if (zone.type === 'stat') {
    return (
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          background: isSelected ? colors.bg : 'transparent',
          border: isSelected
            ? `2px solid ${colors.accent}`
            : `1px dashed ${colors.border}40`,
          flexDirection: s.layout === 'horizontal' ? 'row' : 'column',
          gap: '2px',
        }}
      >
        <div className="pointer-events-none select-none text-center" style={{ opacity: 0.7 }}>
          <div style={{
            fontSize: `${Math.min(s.valueSize || 48, 40)}px`,
            fontWeight: s.valueFontWeight || '800',
            color: s.valueColor || colors.accent,
            fontFamily: s.valueFontFamily || 'Inter, sans-serif',
            lineHeight: 1,
          }}>
            42%
          </div>
          <div style={{
            fontSize: `${Math.min(s.labelSize || 14, 14)}px`,
            color: s.labelColor || '#999',
            fontFamily: s.labelFontFamily || 'Inter, sans-serif',
          }}>
            Metric Label
          </div>
        </div>
      </div>
    )
  }

  // ─── CHART: show placeholder with chart icon ───
  if (zone.type === 'chart') {
    const cfg = (zone as any).chartConfig || {}
    const types = (cfg.preferredChartTypes || []).join(', ') || 'chart'
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center overflow-hidden rounded"
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          background: isSelected ? colors.bg : `${colors.bg}`,
          border: isSelected
            ? `2px solid ${colors.accent}`
            : `1px dashed ${colors.border}40`,
        }}
      >
        {/* Mini chart bars for visual effect */}
        <div className="flex items-end gap-1 mb-1 pointer-events-none select-none" style={{ height: '40%' }}>
          {[0.6, 0.9, 0.4, 0.75, 0.55].map((h, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: Math.max(6, Math.min(16, (zone.position?.width || 100) * 0.06)),
                height: `${h * 100}%`,
                background: `${colors.accent}${i === 1 ? '' : '80'}`,
              }}
            />
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-gray-500 pointer-events-none select-none">
          {types}
        </span>
      </div>
    )
  }

  // ─── Fallback ───
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        background: colors.bg,
        border: isSelected ? `2px solid ${colors.accent}` : `1px dashed ${colors.border}50`,
      }}
    >
      <ZoneLabel label={getZoneLabel(zone)} color={colors.accent} message={(zone as BaseZone).message} />
    </div>
  )
}


// ═══════════════════════════════════════════════════════
// Background CSS
// ═══════════════════════════════════════════════════════

function getBackgroundCSS(s: any): React.CSSProperties {
  if (s.type === 'solid') return { backgroundColor: s.color || '#0f172a' }
  if (s.type === 'gradient') {
    return {
      background: `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientColor1 || '#0f172a'}, ${s.gradientColor2 || '#1e293b'})`,
    }
  }
  if (s.type === 'image' && s.imageUrl) {
    return {
      backgroundImage: `url(${s.imageUrl})`,
      backgroundSize: s.imageFit || 'cover',
      backgroundPosition: 'center',
    }
  }
  if (s.type === 'pattern') {
    const patternBg: Record<string, string> = {
      dots: `radial-gradient(circle, ${s.patternColor || '#fff'}20 1px, transparent 1px)`,
      lines: `repeating-linear-gradient(0deg, ${s.patternColor || '#fff'}10, ${s.patternColor || '#fff'}10 1px, transparent 1px, transparent 20px)`,
      grid: `linear-gradient(${s.patternColor || '#fff'}10 1px, transparent 1px), linear-gradient(90deg, ${s.patternColor || '#fff'}10 1px, transparent 1px)`,
      diagonal: `repeating-linear-gradient(45deg, ${s.patternColor || '#fff'}10, ${s.patternColor || '#fff'}10 1px, transparent 1px, transparent 20px)`,
    }
    return {
      backgroundColor: s.color || '#0f172a',
      backgroundImage: patternBg[s.patternType || 'dots'] || patternBg.dots,
      backgroundSize: '20px 20px',
    }
  }
  return { backgroundColor: '#0f172a' }
}

// ═══════════════════════════════════════════════════════
// Zone Label (small overlay)
// ═══════════════════════════════════════════════════════

function ZoneLabel({ label, color, message }: { label: string; color: string; message?: string }) {
  return (
    <div className="absolute bottom-1 left-1 flex flex-col items-start gap-0.5 pointer-events-none select-none">
      <span
        className="text-[8px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-sm"
        style={{ color, background: 'rgba(0,0,0,0.5)' }}
      >
        {label}
      </span>
      {message && (
        <div className="flex items-center gap-0.5 text-[7px] text-gray-400 px-1">
          <MessageSquare className="w-2 h-2 shrink-0" />
          <span className="truncate max-w-[100px]">{message}</span>
        </div>
      )}
    </div>
  )
}



