import type {
  FormatSkeleton, FormatZone, ZoneType, TextZoneRole,
  StatZoneRole, DecorationSubtype, FormatCategory,
  FormatColorPalette, FormatDimensions, ZonePosition,
  ImageZoneStyle,
} from '@/lib/format-types'
import {
  BarChart3, Type, Hash, Image, Shapes, ImageIcon
} from 'lucide-react'
import React from 'react'

// ==========================================
// ZONE VISUAL CONSTANTS
// ==========================================

export const ZONE_COLORS: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  chart:      { bg: 'rgba(59, 130, 246, 0.08)',  border: '#3b82f6', accent: '#3b82f6', label: 'Chart' },
  text:       { bg: 'rgba(16, 185, 129, 0.08)',  border: '#10b981', accent: '#10b981', label: 'Text' },
  stat:       { bg: 'rgba(245, 158, 11, 0.08)',  border: '#f59e0b', accent: '#f59e0b', label: 'Stat' },
  background: { bg: 'rgba(139, 92, 246, 0.08)',  border: '#8b5cf6', accent: '#8b5cf6', label: 'BG' },
  decoration: { bg: 'rgba(236, 72, 153, 0.08)',  border: '#ec4899', accent: '#ec4899', label: 'Deco' },
  image:      { bg: 'rgba(6, 182, 212, 0.08)',   border: '#06b6d4', accent: '#06b6d4', label: 'Image' },
}

export const ZONE_ICONS: Record<string, React.ReactNode> = {
  chart: React.createElement(BarChart3, { className: 'w-3.5 h-3.5' }),
  text: React.createElement(Type, { className: 'w-3.5 h-3.5' }),
  stat: React.createElement(Hash, { className: 'w-3.5 h-3.5' }),
  background: React.createElement(Image, { className: 'w-3.5 h-3.5' }),
  decoration: React.createElement(Shapes, { className: 'w-3.5 h-3.5' }),
  image: React.createElement(ImageIcon, { className: 'w-3.5 h-3.5' }),
}

// ==========================================
// DIMENSION PRESETS
// ==========================================

export const DIMENSION_PRESETS = [
  { label: 'Instagram Post',      width: 1080, height: 1080, aspect: '1:1',     tag: 'IG Post' },
  { label: 'Instagram Portrait',   width: 1080, height: 1350, aspect: '4:5',     tag: '4:5' },
  { label: 'Story / Reels',        width: 1080, height: 1920, aspect: '9:16',    tag: 'Story' },
  { label: 'HD Report (Landscape)',width: 1920, height: 1080, aspect: '16:9',    tag: '16:9' },
  { label: 'Twitter / X Post',     width: 1200, height: 675,  aspect: '16:9',    tag: 'Twitter' },
  { label: 'LinkedIn Post',        width: 1200, height: 627,  aspect: '1.91:1',  tag: 'LinkedIn' },
  { label: 'A4 Portrait',          width: 794,  height: 1123, aspect: '1:√2',    tag: 'A4' },
] as const

// ==========================================
// CATEGORY OPTIONS
// ==========================================

export const CATEGORY_OPTIONS: { label: string; value: FormatCategory }[] = [
  { label: 'Infographic',  value: 'infographic' },
  { label: 'Social Media', value: 'social' },
  { label: 'Report',       value: 'report' },
  { label: 'Presentation', value: 'presentation' },
  { label: 'Template',     value: 'template' },
]

// ==========================================
// TEXT ROLES & STAT ROLES
// ==========================================

export const TEXT_ROLES: { label: string; value: TextZoneRole }[] = [
  { label: 'Title',    value: 'title' },
  { label: 'Subtitle', value: 'subtitle' },
  { label: 'Body',     value: 'body' },
  { label: 'Source',   value: 'source' },
  { label: 'Callout',  value: 'callout' },
]

export const STAT_ROLES: { label: string; value: StatZoneRole }[] = [
  { label: 'Primary',   value: 'highlight' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary',  value: 'tertiary' },
]

export const DECORATION_SUBTYPES: { label: string; value: DecorationSubtype; desc: string }[] = [
  { label: 'Shape',         value: 'shape',      desc: 'Rectangle, circle, star, hexagon, cloud…' },
  { label: 'Line / Arrow',  value: 'line',       desc: 'Lines, arrows, double arrows' },
  { label: 'Connector',     value: 'connector',  desc: 'Connected lines, cloud lines, freehand' },
  { label: 'Icon / Emoji',  value: 'icon',       desc: 'Stars, checkmarks, emojis, markers…' },
  { label: 'Image',         value: 'image',      desc: 'Upload or paste an image URL' },
  { label: 'SVG Upload',    value: 'svg-upload',  desc: 'Paste custom SVG markup' },
]

// ==========================================
// MESSAGE PRESETS
// ==========================================

export const MESSAGE_PRESETS: Record<string, string[]> = {
  'text:title':    ['Generate a compelling headline about the data', 'Create an attention-grabbing title for the key trend'],
  'text:subtitle': ['Write a one-line subtitle explaining the context', 'Summarize the data topic in a brief tagline'],
  'text:body':     ['Write 2-3 sentences explaining the main finding', 'Provide a brief analysis highlighting key insights'],
  'text:source':   ['Add an appropriate data source attribution', 'Include the data source and year'],
  'text:callout':  ['Write one surprising fact from the data', 'Highlight the most impactful takeaway'],
  'stat':          ['Extract the most impactful metric', 'Show the key percentage or value'],
  'chart':         ['Use the most appropriate chart type', 'Display data with emphasis on comparison'],
  'background':    ['Set a professional background for this data topic', 'Use gradients complementing the palette'],
  'decoration':    ['Add a subtle decorative element for visual hierarchy'],
}

// ==========================================
// DEFAULT PALETTE
// ==========================================

export const DEFAULT_PALETTE: FormatColorPalette = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  text: '#ffffff',
  background: '#0f172a',
  accent: '#f59e0b',
  chartColors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'],
}

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

export function createDefaultSkeleton(): FormatSkeleton {
  return {
    id: `fmt-${Date.now()}`,
    name: 'New Format',
    description: '',
    category: 'infographic',
    dimensions: { width: 1080, height: 1080, aspect: '1:1', label: 'Instagram Post' },
    zones: [
      {
        id: `bg-${Date.now()}`,
        type: 'background' as const,
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: '#0f172a',
          gradientColor2: '#1e293b',
        },
      },
    ],
    colorPalette: { ...DEFAULT_PALETTE },
    tags: [],
    hasPrefilledBackground: true,
    isOfficial: true,
    isPublic: true,
  }
}

export function createZone(
  type: ZoneType,
  dims: FormatDimensions,
  palette: FormatColorPalette,
  subConfig?: Record<string, any>
): FormatZone {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  switch (type) {
    case 'text': {
      const role: TextZoneRole = subConfig?.role || 'title'
      const isTitle = role === 'title'
      return {
        id, type: 'text', role,
        position: { x: 60, y: isTitle ? 40 : 140, width: dims.width - 120, height: isTitle ? 80 : 60 },
        style: {
          fontSize: isTitle ? 36 : role === 'subtitle' ? 20 : role === 'source' ? 11 : 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: isTitle ? '800' : role === 'subtitle' ? '500' : '400',
          color: palette.text || '#ffffff',
          textAlign: 'center',
          lineHeight: isTitle ? 1.15 : 1.4,
        },
      }
    }
    case 'chart': {
      return {
        id, type: 'chart',
        position: { x: 60, y: 200, width: dims.width - 120, height: Math.min(500, dims.height * 0.45) },
        chartConfig: {
          preferredChartTypes: ['bar', 'pie', 'line'],
          backgroundColor: 'transparent',
          legendPosition: 'bottom',
        },
      }
    }
    case 'stat': {
      const role: StatZoneRole = subConfig?.role || 'highlight'
      return {
        id, type: 'stat', role,
        position: { x: 60, y: dims.height - 220, width: (dims.width - 140) / 3, height: 120 },
        style: {
          valueSize: role === 'highlight' ? 52 : 36,
          labelSize: role === 'highlight' ? 14 : 12,
          valueColor: palette.primary,
          labelColor: (palette.text || '#ffffff') + '99',
          valueFontWeight: '800',
          valueFontFamily: 'Inter, sans-serif',
          labelFontFamily: 'Inter, sans-serif',
          layout: 'vertical',
        },
      }
    }
    case 'decoration': {
      const subtype: DecorationSubtype = subConfig?.subtype || 'shape'
      const defaultPos = { x: dims.width * 0.1, y: dims.height * 0.4, width: 150, height: 150 }
      const linePos = { x: dims.width * 0.15, y: dims.height * 0.5, width: dims.width * 0.7, height: 4 }

      const styleMap: Record<string, any> = {
        'shape':      { shapeType: 'rectangle', shapeColor: palette.accent, shapeOpacity: 0.2, strokeColor: palette.primary, strokeWidth: 0 },
        'line':       { lineType: 'arrow', lineColor: palette.primary, lineThickness: 2, lineStyle: 'solid' },
        'connector':  { lineType: 'connected-lines', lineColor: palette.primary, lineThickness: 2, lineStyle: 'solid' },
        'icon':       { iconType: 'emoji-star', iconColor: palette.accent, iconSize: 48 },
        'image':      { imageUrl: '', imageFit: 'cover', imageBorderRadius: 8 },
        'svg-upload': { svgContent: '', svgColor: palette.primary, svgOpacity: 1 },
      }

      return {
        id, type: 'decoration', subtype,
        position: subtype === 'line' || subtype === 'connector' ? linePos : defaultPos,
        style: styleMap[subtype] || styleMap['shape'],
      }
    }
    case 'background': {
      return {
        id, type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: palette.background || '#0f172a',
          gradientColor2: '#1e293b',
        },
      }
    }
    case 'image': {
      return {
        id, type: 'image',
        position: { x: 60, y: dims.height * 0.3, width: dims.width - 120, height: dims.height * 0.35 },
        style: {
          imageFit: 'cover',
          borderRadius: 8,
          backgroundColor: '#1e293b',
        } as ImageZoneStyle,
        placeholder: subConfig?.placeholder || 'contextual',
      } as any
    }
    default:
      throw new Error(`Unknown zone type: ${type}`)
  }
}

/** Get the display label for a zone */
export function getZoneLabel(zone: FormatZone): string {
  switch (zone.type) {
    case 'text': return zone.role
    case 'stat': return `stat:${zone.role}`
    case 'decoration': return zone.subtype
    case 'chart': return 'chart'
    case 'background': return 'background'
    case 'image': return 'image'
  }
}

/** Get the message preset key for a zone */
export function getPresetKey(zone: FormatZone): string {
  if (zone.type === 'text') return `text:${zone.role}`
  return zone.type
}
