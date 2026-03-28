"use client"

import React from "react"
import type { FormatBlueprintRow, RenderedFormat } from "@/lib/format-types"
import { FormatRenderer } from "./FormatRenderer"

// Zone type → color mapping for skeleton-only preview (when no rendered content)
const ZONE_COLORS: Record<string, { bg: string; border: string }> = {
  chart:      { bg: 'rgba(59, 130, 246, 0.3)',  border: '#3b82f6' },
  text:       { bg: 'rgba(16, 185, 129, 0.2)',  border: '#10b981' },
  stat:       { bg: 'rgba(245, 158, 11, 0.3)',  border: '#f59e0b' },
  background: { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6' },
  decoration: { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899' },
}

interface VariantCardProps {
  format: FormatBlueprintRow
  onSelect: (formatId: string) => void
  isSelected?: boolean
  /** If provided, renders a live preview with actual content */
  renderedVariant?: RenderedFormat
}

export function VariantCard({ format, onSelect, isSelected, renderedVariant }: VariantCardProps) {
  const skeleton = format.skeleton as any
  const zones = skeleton?.zones || []
  const dims = format.dimensions
  const palette = skeleton?.colorPalette

  // Calculate scale to fit in the card preview area
  const previewW = 240
  const previewH = 160
  const scale = Math.min(previewW / dims.width, previewH / dims.height, 1)
  const scaledW = dims.width * scale
  const scaledH = dims.height * scale

  return (
    <button
      onClick={() => onSelect(format.id)}
      className={`group relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden text-left
        ${isSelected 
          ? 'border-purple-500 bg-white shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30' 
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:shadow-purple-500/5'
        }`}
    >
      {/* Skeleton Preview */}
      <div className="relative w-full h-44 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {renderedVariant ? (
          /* Live preview with FormatRenderer when chart data available */
          <div
            className="relative rounded-sm overflow-hidden shadow-sm"
            style={{
              width: scaledW,
              height: scaledH,
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <FormatRenderer
              rendered={renderedVariant}
              scale={scale}
              className="w-full h-full"
            />
          </div>
        ) : (
          /* Fallback: colored zone placeholders */
          <div
            className="relative rounded-sm overflow-hidden shadow-sm"
            style={{
              width: scaledW,
              height: scaledH,
              backgroundColor: palette?.background || '#f8f9fa',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {zones
              .filter((z: any) => z.position)
              .map((zone: any) => {
                const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.decoration
                const zoneW = zone.position.width * scale
                const zoneH = zone.position.height * scale

                return (
                  <div
                    key={zone.id}
                    className="absolute flex items-center justify-center overflow-hidden"
                    style={{
                      left: zone.position.x * scale,
                      top: zone.position.y * scale,
                      width: zoneW,
                      height: zoneH,
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderStyle: 'solid',
                    }}
                  >
                    {zoneW > 25 && zoneH > 12 && (
                      <span 
                        className="text-[7px] font-semibold uppercase tracking-wider truncate px-0.5 opacity-70"
                        style={{ color: colors.border }}
                      >
                        {zone.type === 'chart' ? '📊' : 
                         zone.type === 'stat' ? '#' :
                         zone.type === 'text' ? (zone.role === 'title' ? 'T' : 'Aa') :
                         ''}
                      </span>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-purple-600/90 backdrop-blur-sm">
            Select Format
          </span>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Live preview badge */}
        {renderedVariant && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500/90 text-white text-[9px] font-bold rounded-md shadow-sm uppercase tracking-wider">
            Live
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800 truncate">{format.name}</h4>
          <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">
            {dims.aspect}
          </span>
        </div>

        {/* Color palette strip */}
        {palette && (
          <div className="flex gap-0.5 h-2 rounded-sm overflow-hidden">
            {[palette.primary, palette.secondary, palette.accent, palette.text, palette.background].map((color: string, i: number) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Dimension label and category */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
            {dims.width}×{dims.height}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-500 font-medium capitalize">
            {format.category}
          </span>
        </div>
      </div>
    </button>
  )
}
