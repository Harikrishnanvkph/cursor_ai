/**
 * Default Format Skeletons
 * 
 * 10 starter formats spanning different categories, dimensions, and styles.
 * Two types:
 *   - Skeleton-only: Background filled at runtime (contextual-image/gradient via keywords)
 *   - Pre-filled: Admin has set a specific background color/gradient already
 * 
 * These are seeded to the format_blueprints table as official formats.
 */

import type { FormatSkeleton } from './format-types';

export const defaultFormats: FormatSkeleton[] = [

  // ──────────────────────────────────────────────
  // 1. INFOGRAPHIC CLASSIC — 1080×1350 (4:5)
  //    Contextual image background with dark overlay
  // ──────────────────────────────────────────────
  {
    id: 'fmt-infographic-classic',
    name: 'Infographic Classic',
    description: 'Full infographic layout with contextual background, title, chart, key stats, and source. Perfect for Instagram and Pinterest.',
    category: 'infographic',
    dimensions: { width: 1080, height: 1350, aspect: '4:5', label: 'Instagram / Pinterest' },
    hasPrefilledBackground: false,
    tags: ['infographic', 'instagram', 'pinterest', 'contextual'],
    sortOrder: 1,
    colorPalette: {
      primary: '#FFD700',
      secondary: '#764BA2',
      text: '#FFFFFF',
      background: '#1A1A2E',
      accent: '#E94560',
      chartColors: ['#FFD700', '#E94560', '#4ECDC4', '#764BA2', '#FF6B6B', '#45B7D1']
    },
    zones: [
      {
        id: 'bg-1',
        type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: '#2525b6ff',
          gradientColor2: '#16213E'
        }
      },
      {
        id: 'title-1',
        type: 'text',
        role: 'title',
        position: { x: 60, y: 50, width: 960, height: 120 },
        style: {
          fontSize: 40,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '800',
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.15,
          textTransform: 'uppercase'
        }
      },
      {
        id: 'subtitle-1',
        type: 'text',
        role: 'subtitle',
        position: { x: 60, y: 180, width: 960, height: 50 },
        style: {
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#FFD700',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 2,
          textTransform: 'uppercase'
        }
      },
      {
        id: 'divider-1',
        type: 'decoration',
        subtype: 'divider',
        position: { x: 380, y: 245, width: 320, height: 4 },
        style: {
          dividerColor: '#FFD700',
          dividerThickness: 3,
          dividerStyle: 'solid'
        }
      },
      {
        id: 'chart-1',
        type: 'chart',
        position: { x: 60, y: 270, width: 960, height: 480 },
        chartConfig: {
          preferredChartTypes: ['pie', 'doughnut', 'pie3d', 'doughnut3d'],
          backgroundColor: 'transparent',
          legendPosition: 'bottom',
          legendColor: '#E0E0E0'
        }
      },
      {
        id: 'stat-highlight-1',
        type: 'stat',
        role: 'highlight',
        position: { x: 60, y: 790, width: 450, height: 130 },
        style: {
          valueSize: 52,
          labelSize: 14,
          valueColor: '#FFD700',
          labelColor: '#CCCCCC',
          valueFontWeight: '800',
          valueFontFamily: 'Inter, sans-serif',
          labelFontFamily: 'Inter, sans-serif',
          layout: 'vertical'
        }
      },
      {
        id: 'stat-secondary-1',
        type: 'stat',
        role: 'secondary',
        position: { x: 570, y: 790, width: 450, height: 130 },
        style: {
          valueSize: 52,
          labelSize: 14,
          valueColor: '#E94560',
          labelColor: '#CCCCCC',
          valueFontWeight: '800',
          valueFontFamily: 'Inter, sans-serif',
          labelFontFamily: 'Inter, sans-serif',
          layout: 'vertical'
        }
      },
      {
        id: 'body-1',
        type: 'text',
        role: 'body',
        position: { x: 60, y: 950, width: 960, height: 220 },
        style: {
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#E0E0E0',
          textAlign: 'left',
          lineHeight: 1.7
        }
      },
      {
        id: 'source-1',
        type: 'text',
        role: 'source',
        position: { x: 60, y: 1200, width: 960, height: 30 },
        style: {
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#888888',
          textAlign: 'center',
          fontStyle: 'italic'
        }
      },
      {
        id: 'border-1',
        type: 'decoration',
        subtype: 'border',
        style: {
          borderColor: '#FFD700',
          borderWidth: 3,
          borderRadius: 16
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 2. BOLD STATS — 1080×1080 (1:1)
  //    Pre-filled dark background, stat-driven
  // ──────────────────────────────────────────────
  {
    id: 'fmt-bold-stats',
    name: 'Bold Stats',
    description: 'Big numbers front and center with chart below. Dark theme, stat-focused layout for maximum impact.',
    category: 'infographic',
    dimensions: { width: 1080, height: 1080, aspect: '1:1', label: 'Square Post' },
    hasPrefilledBackground: true,
    tags: ['stats', 'bold', 'dark', 'square'],
    sortOrder: 2,
    colorPalette: {
      primary: '#4ECDC4',
      secondary: '#FF6B6B',
      text: '#FFFFFF',
      background: '#0F0F23',
      accent: '#FFE66D',
      chartColors: ['#4ECDC4', '#FF6B6B', '#FFE66D', '#A8E6CF', '#FF8B94', '#B5EAD7']
    },
    zones: [
      {
        id: 'bg-2',
        type: 'background',
        style: {
          type: 'solid',
          color: '#0F0F23'
        }
      },
      {
        id: 'stat-highlight-2',
        type: 'stat',
        role: 'highlight',
        position: { x: 60, y: 60, width: 960, height: 180 },
        style: {
          valueSize: 80,
          labelSize: 18,
          valueColor: '#4ECDC4',
          labelColor: '#999999',
          valueFontWeight: '900',
          valueFontFamily: 'Inter, sans-serif',
          labelFontFamily: 'Inter, sans-serif',
          layout: 'vertical'
        }
      },
      {
        id: 'divider-2',
        type: 'decoration',
        subtype: 'divider',
        position: { x: 60, y: 260, width: 960, height: 2 },
        style: {
          dividerColor: '#4ECDC4',
          dividerThickness: 2,
          dividerStyle: 'gradient'
        }
      },
      {
        id: 'title-2',
        type: 'text',
        role: 'title',
        position: { x: 60, y: 280, width: 960, height: 80 },
        style: {
          fontSize: 28,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.3
        }
      },
      {
        id: 'chart-2',
        type: 'chart',
        position: { x: 60, y: 380, width: 960, height: 420 },
        chartConfig: {
          preferredChartTypes: ['bar', 'horizontalBar', 'bar3d'],
          backgroundColor: 'transparent',
          legendPosition: 'none',
          gridColor: '#1a1a3e'
        }
      },
      {
        id: 'stat-row-2',
        type: 'stat',
        role: 'secondary',
        position: { x: 60, y: 830, width: 450, height: 100 },
        style: {
          valueSize: 36,
          labelSize: 12,
          valueColor: '#FF6B6B',
          labelColor: '#888888',
          valueFontWeight: '800',
          layout: 'vertical'
        }
      },
      {
        id: 'stat-tertiary-2',
        type: 'stat',
        role: 'tertiary',
        position: { x: 570, y: 830, width: 450, height: 100 },
        style: {
          valueSize: 36,
          labelSize: 12,
          valueColor: '#FFE66D',
          labelColor: '#888888',
          valueFontWeight: '800',
          layout: 'vertical'
        }
      },
      {
        id: 'source-2',
        type: 'text',
        role: 'source',
        position: { x: 60, y: 950, width: 960, height: 30 },
        style: {
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#555555',
          textAlign: 'center',
          fontStyle: 'italic'
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 3. SOCIAL STORY — 1080×1920 (9:16)
  //    Gradient background, vertical layout
  // ──────────────────────────────────────────────
  {
    id: 'fmt-social-story',
    name: 'Social Story',
    description: 'Vertical story format for Instagram/TikTok. Bold title, large chart, key insight, dark gradient.',
    category: 'social',
    dimensions: { width: 1080, height: 1920, aspect: '9:16', label: 'Story / Reels' },
    hasPrefilledBackground: true,
    tags: ['story', 'instagram', 'tiktok', 'vertical', 'gradient'],
    sortOrder: 3,
    colorPalette: {
      primary: '#667EEA',
      secondary: '#764BA2',
      text: '#FFFFFF',
      background: '#0F0A2E',
      accent: '#FF6B9D',
      chartColors: ['#667EEA', '#764BA2', '#FF6B9D', '#F093FB', '#4FD1C5', '#63B3ED']
    },
    zones: [
      {
        id: 'bg-3',
        type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '160deg',
          gradientColor1: '#0F0A2E',
          gradientColor2: '#1A0A3E'
        }
      },
      {
        id: 'icon-3',
        type: 'decoration',
        subtype: 'svg-icon',
        position: { x: 460, y: 100, width: 160, height: 160 },
        contextual: true,
        style: {
          svgColor: '#667EEA',
          svgOpacity: 0.8
        }
      },
      {
        id: 'title-3',
        type: 'text',
        role: 'title',
        position: { x: 80, y: 300, width: 920, height: 160 },
        style: {
          fontSize: 44,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '900',
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.15,
          textTransform: 'uppercase'
        }
      },
      {
        id: 'subtitle-3',
        type: 'text',
        role: 'subtitle',
        position: { x: 80, y: 480, width: 920, height: 50 },
        style: {
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#A0A0CC',
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 3,
          textTransform: 'uppercase'
        }
      },
      {
        id: 'chart-3',
        type: 'chart',
        position: { x: 60, y: 570, width: 960, height: 580 },
        chartConfig: {
          preferredChartTypes: ['doughnut', 'pie', 'doughnut3d', 'polarArea'],
          backgroundColor: 'transparent',
          legendPosition: 'bottom',
          legendColor: '#CCCCDD'
        }
      },
      {
        id: 'stat-highlight-3',
        type: 'stat',
        role: 'highlight',
        position: { x: 80, y: 1200, width: 920, height: 160 },
        style: {
          valueSize: 72,
          labelSize: 16,
          valueColor: '#FF6B9D',
          labelColor: '#A0A0CC',
          valueFontWeight: '900',
          valueFontFamily: 'Inter, sans-serif',
          layout: 'vertical'
        }
      },
      {
        id: 'body-3',
        type: 'text',
        role: 'body',
        position: { x: 80, y: 1400, width: 920, height: 220 },
        style: {
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#C0C0DD',
          textAlign: 'center',
          lineHeight: 1.7
        },
        maxLength: 200
      },
      {
        id: 'source-3',
        type: 'text',
        role: 'source',
        position: { x: 80, y: 1680, width: 920, height: 30 },
        style: {
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#666688',
          textAlign: 'center',
          fontStyle: 'italic'
        }
      },
      {
        id: 'shape-dots-3',
        type: 'decoration',
        subtype: 'shape',
        position: { x: 0, y: 1760, width: 1080, height: 160 },
        style: {
          shapeType: 'dots',
          shapeColor: '#667EEA',
          shapeOpacity: 0.15
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 4. INSTAGRAM POST — 1080×1080 (1:1)
  //    Pre-filled warm gradient, clean social media
  // ──────────────────────────────────────────────
  {
    id: 'fmt-instagram-post',
    name: 'Instagram Post',
    description: 'Clean square layout with warm gradient. Title, chart, and a callout insight. Designed for social sharing.',
    category: 'social',
    dimensions: { width: 1080, height: 1080, aspect: '1:1', label: 'Instagram Post' },
    hasPrefilledBackground: true,
    tags: ['social', 'instagram', 'square', 'warm', 'clean'],
    sortOrder: 4,
    colorPalette: {
      primary: '#FF6B6B',
      secondary: '#FFA07A',
      text: '#2D2D2D',
      background: '#FFF5F0',
      accent: '#FF4757',
      chartColors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D']
    },
    zones: [
      {
        id: 'bg-4',
        type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: '#FFF5F0',
          gradientColor2: '#FFE8E0'
        }
      },
      {
        id: 'title-4',
        type: 'text',
        role: 'title',
        position: { x: 80, y: 60, width: 920, height: 100 },
        style: {
          fontSize: 34,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '800',
          color: '#2D2D2D',
          textAlign: 'center',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-4',
        type: 'text',
        role: 'subtitle',
        position: { x: 80, y: 170, width: 920, height: 40 },
        style: {
          fontSize: 15,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          color: '#FF6B6B',
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 1
        }
      },
      {
        id: 'chart-4',
        type: 'chart',
        position: { x: 80, y: 240, width: 920, height: 520 },
        chartConfig: {
          preferredChartTypes: ['bar', 'line', 'area'],
          backgroundColor: 'rgba(255,255,255,0.6)',
          legendPosition: 'top',
          showGrid: true,
          gridColor: '#FFE8E0'
        }
      },
      {
        id: 'callout-4',
        type: 'text',
        role: 'callout',
        position: { x: 80, y: 800, width: 920, height: 100 },
        style: {
          fontSize: 20,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          color: '#FF4757',
          textAlign: 'center',
          lineHeight: 1.4
        }
      },
      {
        id: 'source-4',
        type: 'text',
        role: 'source',
        position: { x: 80, y: 930, width: 920, height: 30 },
        style: {
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#999999',
          textAlign: 'center',
          fontStyle: 'italic'
        }
      },
      {
        id: 'shape-accent-4',
        type: 'decoration',
        subtype: 'shape',
        position: { x: 0, y: 0, width: 1080, height: 8 },
        style: {
          shapeType: 'rectangle',
          shapeColor: '#FF6B6B',
          shapeOpacity: 1
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 5. PROFESSIONAL REPORT — 1920×1080 (16:9)
  //    White bg, clean grid, side-by-side layout
  // ──────────────────────────────────────────────
  {
    id: 'fmt-professional-report',
    name: 'Professional Report',
    description: 'Clean widescreen report layout. Chart on the left, key stats and description on the right. White background.',
    category: 'report',
    dimensions: { width: 1920, height: 1080, aspect: '16:9', label: 'Widescreen Report' },
    hasPrefilledBackground: true,
    tags: ['report', 'professional', 'clean', 'widescreen', 'white'],
    sortOrder: 5,
    colorPalette: {
      primary: '#2563EB',
      secondary: '#1E40AF',
      text: '#1F2937',
      background: '#FFFFFF',
      accent: '#3B82F6',
      chartColors: ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#6366F1']
    },
    zones: [
      {
        id: 'bg-5',
        type: 'background',
        style: {
          type: 'solid',
          color: '#FFFFFF'
        }
      },
      {
        id: 'accent-bar-5',
        type: 'decoration',
        subtype: 'shape',
        position: { x: 0, y: 0, width: 8, height: 1080 },
        style: {
          shapeType: 'rectangle',
          shapeColor: '#2563EB',
          shapeOpacity: 1
        }
      },
      {
        id: 'title-5',
        type: 'text',
        role: 'title',
        position: { x: 60, y: 50, width: 1800, height: 60 },
        style: {
          fontSize: 32,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#1F2937',
          textAlign: 'left',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-5',
        type: 'text',
        role: 'subtitle',
        position: { x: 60, y: 120, width: 1800, height: 40 },
        style: {
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#6B7280',
          textAlign: 'left',
          lineHeight: 1.3
        }
      },
      {
        id: 'divider-5',
        type: 'decoration',
        subtype: 'divider',
        position: { x: 60, y: 175, width: 1800, height: 2 },
        style: {
          dividerColor: '#E5E7EB',
          dividerThickness: 1,
          dividerStyle: 'solid'
        }
      },
      {
        id: 'chart-5',
        type: 'chart',
        position: { x: 60, y: 200, width: 1100, height: 650 },
        chartConfig: {
          preferredChartTypes: ['bar', 'line', 'area', 'horizontalBar'],
          backgroundColor: '#FAFAFA',
          legendPosition: 'top',
          showGrid: true,
          gridColor: '#F3F4F6'
        }
      },
      {
        id: 'stat-highlight-5',
        type: 'stat',
        role: 'highlight',
        position: { x: 1220, y: 200, width: 640, height: 140 },
        style: {
          valueSize: 48,
          labelSize: 14,
          valueColor: '#2563EB',
          labelColor: '#6B7280',
          valueFontWeight: '800',
          valueFontFamily: 'Inter, sans-serif',
          layout: 'vertical'
        }
      },
      {
        id: 'stat-secondary-5',
        type: 'stat',
        role: 'secondary',
        position: { x: 1220, y: 360, width: 640, height: 120 },
        style: {
          valueSize: 36,
          labelSize: 12,
          valueColor: '#7C3AED',
          labelColor: '#6B7280',
          valueFontWeight: '700',
          layout: 'vertical'
        }
      },
      {
        id: 'body-5',
        type: 'text',
        role: 'body',
        position: { x: 1220, y: 500, width: 640, height: 350 },
        style: {
          fontSize: 15,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#4B5563',
          textAlign: 'left',
          lineHeight: 1.7
        }
      },
      {
        id: 'source-5',
        type: 'text',
        role: 'source',
        position: { x: 60, y: 880, width: 1800, height: 30 },
        style: {
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#9CA3AF',
          textAlign: 'left',
          fontStyle: 'italic'
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 6. PRESENTATION SLIDE — 1920×1080 (16:9)
  //    Dark gradient, presentation-ready
  // ──────────────────────────────────────────────
  {
    id: 'fmt-presentation-slide',
    name: 'Presentation Slide',
    description: 'Dark gradient widescreen slide. Clean title, centered chart, minimal text. Ready for presentations.',
    category: 'presentation',
    dimensions: { width: 1920, height: 1080, aspect: '16:9', label: 'Presentation Slide' },
    hasPrefilledBackground: true,
    tags: ['presentation', 'slide', 'dark', 'widescreen', 'professional'],
    sortOrder: 6,
    colorPalette: {
      primary: '#38BDF8',
      secondary: '#818CF8',
      text: '#F8FAFC',
      background: '#0F172A',
      accent: '#F472B6',
      chartColors: ['#38BDF8', '#818CF8', '#F472B6', '#34D399', '#FBBF24', '#A78BFA']
    },
    zones: [
      {
        id: 'bg-6',
        type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: '#0F172A',
          gradientColor2: '#1E293B'
        }
      },
      {
        id: 'title-6',
        type: 'text',
        role: 'title',
        position: { x: 120, y: 60, width: 1680, height: 80 },
        style: {
          fontSize: 40,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#F8FAFC',
          textAlign: 'left',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-6',
        type: 'text',
        role: 'subtitle',
        position: { x: 120, y: 150, width: 1680, height: 40 },
        style: {
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#94A3B8',
          textAlign: 'left',
          lineHeight: 1.3
        }
      },
      {
        id: 'chart-6',
        type: 'chart',
        position: { x: 120, y: 220, width: 1680, height: 680 },
        chartConfig: {
          preferredChartTypes: ['bar', 'line', 'area', 'horizontalBar', 'bar3d'],
          backgroundColor: 'transparent',
          legendPosition: 'top',
          legendColor: '#CBD5E1',
          showGrid: true,
          gridColor: '#1E293B'
        }
      },
      {
        id: 'source-6',
        type: 'text',
        role: 'source',
        position: { x: 120, y: 930, width: 1680, height: 30 },
        style: {
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#64748B',
          textAlign: 'right',
          fontStyle: 'italic'
        }
      },
      {
        id: 'accent-line-6',
        type: 'decoration',
        subtype: 'divider',
        position: { x: 120, y: 198, width: 100, height: 4 },
        style: {
          dividerColor: '#38BDF8',
          dividerThickness: 4,
          dividerStyle: 'solid'
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 7. COMPACT DATA CARD — 800×800 (1:1)
  //    Clean white, bordered, compact
  // ──────────────────────────────────────────────
  {
    id: 'fmt-compact-data-card',
    name: 'Compact Data Card',
    description: 'Small, clean card with chart and minimal text. Perfect for dashboards, thumbnails, or embedding.',
    category: 'infographic',
    dimensions: { width: 800, height: 800, aspect: '1:1', label: 'Data Card' },
    hasPrefilledBackground: true,
    tags: ['compact', 'card', 'dashboard', 'minimal', 'clean'],
    sortOrder: 7,
    colorPalette: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      text: '#1E293B',
      background: '#FFFFFF',
      accent: '#EC4899',
      chartColors: ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444']
    },
    zones: [
      {
        id: 'bg-7',
        type: 'background',
        style: {
          type: 'solid',
          color: '#FFFFFF'
        }
      },
      {
        id: 'border-7',
        type: 'decoration',
        subtype: 'border',
        style: {
          borderColor: '#E2E8F0',
          borderWidth: 2,
          borderRadius: 20
        }
      },
      {
        id: 'title-7',
        type: 'text',
        role: 'title',
        position: { x: 40, y: 36, width: 720, height: 60 },
        style: {
          fontSize: 22,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#1E293B',
          textAlign: 'left',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-7',
        type: 'text',
        role: 'subtitle',
        position: { x: 40, y: 100, width: 720, height: 30 },
        style: {
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#94A3B8',
          textAlign: 'left',
          lineHeight: 1.3
        }
      },
      {
        id: 'chart-7',
        type: 'chart',
        position: { x: 40, y: 150, width: 720, height: 400 },
        chartConfig: {
          preferredChartTypes: ['line', 'bar', 'area', 'doughnut'],
          backgroundColor: '#FAFBFC',
          legendPosition: 'bottom',
          showGrid: true,
          gridColor: '#F1F5F9'
        }
      },
      {
        id: 'stat-highlight-7',
        type: 'stat',
        role: 'highlight',
        position: { x: 40, y: 580, width: 340, height: 100 },
        style: {
          valueSize: 32,
          labelSize: 11,
          valueColor: '#6366F1',
          labelColor: '#94A3B8',
          valueFontWeight: '800',
          layout: 'vertical'
        }
      },
      {
        id: 'stat-secondary-7',
        type: 'stat',
        role: 'secondary',
        position: { x: 420, y: 580, width: 340, height: 100 },
        style: {
          valueSize: 32,
          labelSize: 11,
          valueColor: '#EC4899',
          labelColor: '#94A3B8',
          valueFontWeight: '800',
          layout: 'vertical'
        }
      },
      {
        id: 'source-7',
        type: 'text',
        role: 'source',
        position: { x: 40, y: 710, width: 720, height: 24 },
        style: {
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#CBD5E1',
          textAlign: 'left',
          fontStyle: 'italic'
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 8. WIDE BANNER — 1200×628 (1.91:1)
  //    Pre-filled blue gradient, Facebook/LinkedIn banner
  // ──────────────────────────────────────────────
  {
    id: 'fmt-wide-banner',
    name: 'Wide Banner',
    description: 'Landscape banner for Facebook/LinkedIn sharing. Chart on right, text on left. Blue gradient background.',
    category: 'social',
    dimensions: { width: 1200, height: 628, aspect: '1.91:1', label: 'Facebook / LinkedIn' },
    hasPrefilledBackground: true,
    tags: ['banner', 'facebook', 'linkedin', 'landscape', 'sharing'],
    sortOrder: 8,
    colorPalette: {
      primary: '#06B6D4',
      secondary: '#0E7490',
      text: '#FFFFFF',
      background: '#042F3D',
      accent: '#22D3EE',
      chartColors: ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC', '#0EA5E9', '#38BDF8']
    },
    zones: [
      {
        id: 'bg-8',
        type: 'background',
        style: {
          type: 'gradient',
          gradientType: 'linear',
          gradientDirection: '135deg',
          gradientColor1: '#042F3D',
          gradientColor2: '#0C4A5E'
        }
      },
      {
        id: 'title-8',
        type: 'text',
        role: 'title',
        position: { x: 50, y: 50, width: 480, height: 100 },
        style: {
          fontSize: 30,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '800',
          color: '#FFFFFF',
          textAlign: 'left',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-8',
        type: 'text',
        role: 'subtitle',
        position: { x: 50, y: 160, width: 480, height: 35 },
        style: {
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#67E8F9',
          textAlign: 'left',
          lineHeight: 1.3,
          letterSpacing: 1
        }
      },
      {
        id: 'stat-highlight-8',
        type: 'stat',
        role: 'highlight',
        position: { x: 50, y: 220, width: 480, height: 120 },
        style: {
          valueSize: 48,
          labelSize: 13,
          valueColor: '#22D3EE',
          labelColor: '#A0C4D0',
          valueFontWeight: '900',
          layout: 'vertical'
        }
      },
      {
        id: 'body-8',
        type: 'text',
        role: 'body',
        position: { x: 50, y: 360, width: 480, height: 150 },
        style: {
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#B0D0DD',
          textAlign: 'left',
          lineHeight: 1.6
        },
        maxLength: 150
      },
      {
        id: 'source-8',
        type: 'text',
        role: 'source',
        position: { x: 50, y: 530, width: 480, height: 24 },
        style: {
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#5A8A9A',
          textAlign: 'left',
          fontStyle: 'italic'
        }
      },
      {
        id: 'chart-8',
        type: 'chart',
        position: { x: 580, y: 40, width: 580, height: 548 },
        chartConfig: {
          preferredChartTypes: ['pie', 'doughnut', 'doughnut3d', 'polarArea'],
          backgroundColor: 'transparent',
          legendPosition: 'bottom',
          legendColor: '#A0C4D0'
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 9. STANDARD TEMPLATE — 1200×800 (3:2)
  //    Bridge to existing template system
  // ──────────────────────────────────────────────
  {
    id: 'fmt-standard-template',
    name: 'Standard Template',
    description: 'Classic report template matching the existing template system. Title, chart, and detailed text area.',
    category: 'template',
    dimensions: { width: 1200, height: 800, aspect: '3:2', label: 'Standard Template' },
    hasPrefilledBackground: true,
    tags: ['template', 'classic', 'report', 'standard'],
    sortOrder: 9,
    colorPalette: {
      primary: '#7C3AED',
      secondary: '#5B21B6',
      text: '#111827',
      background: '#FFFFFF',
      accent: '#A855F7',
      chartColors: ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']
    },
    zones: [
      {
        id: 'bg-9',
        type: 'background',
        style: {
          type: 'solid',
          color: '#FFFFFF'
        }
      },
      {
        id: 'title-9',
        type: 'text',
        role: 'title',
        position: { x: 50, y: 20, width: 1100, height: 45 },
        style: {
          fontSize: 28,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#111827',
          textAlign: 'center',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-9',
        type: 'text',
        role: 'subtitle',
        position: { x: 50, y: 72, width: 1100, height: 30 },
        style: {
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 1.3
        }
      },
      {
        id: 'chart-9',
        type: 'chart',
        position: { x: 50, y: 120, width: 1100, height: 400 },
        chartConfig: {
          preferredChartTypes: ['bar', 'line', 'pie', 'doughnut'],
          backgroundColor: '#FAFAFA',
          legendPosition: 'top',
          showGrid: true,
          gridColor: '#F3F4F6'
        }
      },
      {
        id: 'body-9',
        type: 'text',
        role: 'body',
        position: { x: 50, y: 540, width: 1100, height: 240 },
        style: {
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#374151',
          textAlign: 'left',
          lineHeight: 1.6
        }
      }
    ]
  },

  // ──────────────────────────────────────────────
  // 10. MINIMAL CLEAN — 1080×1080 (1:1)
  //    White, thin accent line, maximum clarity
  // ──────────────────────────────────────────────
  {
    id: 'fmt-minimal-clean',
    name: 'Minimal Clean',
    description: 'Ultra-clean design with thin accent line and generous whitespace. Let the data speak for itself.',
    category: 'report',
    dimensions: { width: 1080, height: 1080, aspect: '1:1', label: 'Minimal Square' },
    hasPrefilledBackground: true,
    tags: ['minimal', 'clean', 'white', 'professional', 'simple'],
    sortOrder: 10,
    colorPalette: {
      primary: '#111827',
      secondary: '#374151',
      text: '#111827',
      background: '#FFFFFF',
      accent: '#EF4444',
      chartColors: ['#111827', '#6B7280', '#D1D5DB', '#EF4444', '#3B82F6', '#10B981']
    },
    zones: [
      {
        id: 'bg-10',
        type: 'background',
        style: {
          type: 'solid',
          color: '#FFFFFF'
        }
      },
      {
        id: 'accent-line-10',
        type: 'decoration',
        subtype: 'shape',
        position: { x: 80, y: 80, width: 60, height: 4 },
        style: {
          shapeType: 'rectangle',
          shapeColor: '#EF4444',
          shapeOpacity: 1
        }
      },
      {
        id: 'title-10',
        type: 'text',
        role: 'title',
        position: { x: 80, y: 100, width: 920, height: 70 },
        style: {
          fontSize: 30,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          color: '#111827',
          textAlign: 'left',
          lineHeight: 1.2
        }
      },
      {
        id: 'subtitle-10',
        type: 'text',
        role: 'subtitle',
        position: { x: 80, y: 180, width: 920, height: 35 },
        style: {
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#9CA3AF',
          textAlign: 'left',
          lineHeight: 1.3
        }
      },
      {
        id: 'chart-10',
        type: 'chart',
        position: { x: 80, y: 240, width: 920, height: 480 },
        chartConfig: {
          preferredChartTypes: ['line', 'bar', 'area'],
          backgroundColor: '#FAFAFA',
          legendPosition: 'top',
          showGrid: true,
          gridColor: '#F3F4F6'
        }
      },
      {
        id: 'body-10',
        type: 'text',
        role: 'body',
        position: { x: 80, y: 750, width: 920, height: 140 },
        style: {
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#6B7280',
          textAlign: 'left',
          lineHeight: 1.7
        },
        maxLength: 250
      },
      {
        id: 'source-10',
        type: 'text',
        role: 'source',
        position: { x: 80, y: 920, width: 920, height: 24 },
        style: {
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '400',
          color: '#D1D5DB',
          textAlign: 'left',
          fontStyle: 'italic'
        }
      }
    ]
  }
];
