/**
 * Chart Style Preset Defaults
 *
 * Official presets shipped with the app.
 * Covers every major chart type with 10+ unique styles each.
 */

import type { ChartStylePreset } from './chart-style-types'

// ── Helper: build a config snapshot with common structure ──
function buildConfig(overrides: Record<string, any>): Record<string, any> {
  return {
    visualSettings: {
      fillArea: overrides.fillArea ?? true,
      showBorder: overrides.showBorder ?? true,
      showImages: true,
      showLabels: overrides.showLabels ?? true,
      uniformityMode: 'uniform',
    },
    background: overrides.background || { type: 'color', color: '#ffffff', opacity: 100 },
    layout: { padding: overrides.padding || { top: 10, right: 10, bottom: 10, left: 10 } },
    plugins: {
      title: {
        display: true,
        font: overrides.titleFont || { size: 18, weight: '700' },
        color: overrides.titleColor || '#1a1a1a',
      },
      subtitle: {
        display: overrides.subtitleDisplay ?? true,
        font: overrides.subtitleFont || { size: 13, weight: '400' },
        color: overrides.subtitleColor || '#6b7280',
      },
      legend: {
        display: overrides.legendDisplay ?? true,
        position: overrides.legendPosition || 'top',
        labels: {
          color: overrides.legendColor || '#374151',
          usePointStyle: true,
          pointStyle: overrides.legendPointStyle || 'rect',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: overrides.tooltipBg || 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: overrides.tooltipBorder || '#ccc',
        borderWidth: 1,
      },
      datalabels: {
        display: overrides.datalabelsDisplay ?? true,
        anchor: overrides.datalabelsAnchor || 'center',
        align: overrides.datalabelsAlign || 'center',
        offset: 0,
        color: overrides.datalabelsColor || '#000',
        font: { weight: 'bold', size: overrides.datalabelsFontSize || 12 },
      },
      ...(overrides.pie3d ? { pie3d: overrides.pie3d } : { pie3d: { enabled: false } }),
      ...(overrides.bar3d ? { bar3d: overrides.bar3d } : { bar3d: { enabled: false } }),
    },
    scales: overrides.scales || {},
    animation: { duration: overrides.animDuration || 1000, easing: overrides.animEasing || 'easeOutQuart' },
    interaction: { intersect: true, mode: 'point' },
    hoverFadeEffect: overrides.hoverFade ?? false,
  }
}

// Axis-chart scales helper
function axisScales(opts: {
  gridColor?: string; gridDisplay?: boolean; tickColor?: string;
  axisColor?: string; beginAtZero?: boolean; xDisplay?: boolean; yDisplay?: boolean;
} = {}): Record<string, any> {
  return {
    x: {
      display: opts.xDisplay ?? true,
      grid: { display: opts.gridDisplay ?? true, color: opts.gridColor || '#e5e7eb' },
      ticks: { color: opts.tickColor || '#6b7280', font: { size: 11 } },
      border: { display: true, color: opts.axisColor || '#d1d5db' },
    },
    y: {
      display: opts.yDisplay ?? true,
      beginAtZero: opts.beginAtZero ?? true,
      grid: { display: opts.gridDisplay ?? true, color: opts.gridColor || '#e5e7eb' },
      ticks: { color: opts.tickColor || '#6b7280', font: { size: 11 } },
      border: { display: true, color: opts.axisColor || '#d1d5db' },
    },
  }
}

// =====================================================
// THE 15 OFFICIAL PRESETS
// =====================================================

export const CHART_STYLE_PRESETS: ChartStylePreset[] = [
  // ── 1. Ocean Breeze (Bar) ─────────────────────────
  {
    id: 'preset-ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Clean blue tones with a fresh, modern feel',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#0ea5e9', '#38bdf8', '#06b6d4', '#22d3ee', '#0284c7', '#0891b2', '#67e8f9', '#a5f3fc'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      scales: axisScales({ gridColor: '#e0f2fe', tickColor: '#0369a1', axisColor: '#bae6fd' }),
      titleColor: '#0c4a6e',
      subtitleColor: '#0369a1',
      legendColor: '#0369a1',
      datalabelsColor: '#ffffff',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 3, borderRadius: 4 },
    dimensions: { width: '800px', height: '600px' },
    category: 'minimal',
    tags: ['blue', 'clean', 'modern'],
    isOfficial: true,
    sortOrder: 1,
  },

  // ── 2. Sunset Glow (Bar) ──────────────────────────
  {
    id: 'preset-sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm oranges, pinks, and gold for a vibrant feel',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#f97316', '#fb923c', '#f59e0b', '#ef4444', '#ec4899', '#f43f5e', '#fbbf24', '#e11d48'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fffbeb', opacity: 100 },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#92400e' }, border: { color: '#fde68a' } },
        y: { grid: { color: '#fef3c7' }, ticks: { color: '#92400e' }, border: { display: false } }
      },
      titleColor: '#78350f',
      titleFont: { size: 20, weight: '800' },
      subtitleColor: '#92400e',
      legendPosition: 'bottom',
      legendColor: '#92400e',
      datalabelsAnchor: 'end',
      datalabelsAlign: 'end',
      datalabelsColor: '#d97706',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 3, borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 } },
    dimensions: { width: '800px', height: '600px' },
    category: 'bold',
    tags: ['warm', 'vibrant', 'sunset'],
    isOfficial: true,
    sortOrder: 2,
  },

  // ── 3. Neon Noir (Bar) ────────────────────────────
  {
    id: 'preset-neon-noir',
    name: 'Neon Noir',
    description: 'Bold neon colors on a dark background',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#00f5d4', '#7b2ff7', '#f72585', '#fee440', '#00bbf9', '#9b5de5', '#f15bb5', '#00f5d4'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'gradient', gradientType: 'linear', gradientDirection: '135deg', gradientColor1: '#0f0f23', gradientColor2: '#1a1a3e', opacity: 100 },
      scales: {
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)' }, border: { color: 'rgba(255,255,255,0.3)', width: 2 } },
        y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: 'rgba(255,255,255,0.6)' }, border: { display: false } }
      },
      titleColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.6)',
      legendPosition: 'right',
      legendColor: 'rgba(255,255,255,0.7)',
      datalabelsDisplay: false,
      tooltipBg: 'rgba(15,15,35,0.95)',
      tooltipBorder: 'rgba(123,47,247,0.3)',
    }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 3, borderRadius: 0 },
    dimensions: { width: '800px', height: '600px' },
    category: 'dark',
    tags: ['neon', 'dark', 'bold', 'modern'],
    isOfficial: true,
    sortOrder: 3,
  },

  // ── 4. Monochrome Slate (Bar) ─────────────────────
  {
    id: 'preset-monochrome-slate',
    name: 'Monochrome Slate',
    description: 'Professional grayscale palette for business presentations',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' }, border: { color: '#e2e8f0' } },
        y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' }, border: { display: false } }
      },
      titleColor: '#0f172a',
      subtitleDisplay: false,
      legendDisplay: false,
      datalabelsAnchor: 'start',
      datalabelsAlign: 'end',
      datalabelsColor: '#ffffff',
    }),
    datasetStyle: { borderWidth: 1, tension: 0, fill: false, pointRadius: 3, borderRadius: 0 },
    dimensions: { width: '800px', height: '600px' },
    category: 'professional',
    tags: ['grayscale', 'professional', 'business'],
    isOfficial: true,
    sortOrder: 4,
  },

  // ── 5. Forest Canopy (Bar) ────────────────────────
  {
    id: 'preset-forest-canopy',
    name: 'Forest Canopy',
    description: 'Earthy greens and browns inspired by nature',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#166534', '#15803d', '#22c55e', '#84cc16', '#a16207', '#ca8a04', '#65a30d', '#4d7c0f'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fefdf5', opacity: 100 },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#3f6212', font: { weight: 'bold' } }, border: { display: false } },
        y: { display: false }
      },
      titleColor: '#14532d',
      subtitleColor: '#3f6212',
      legendPosition: 'top',
      legendColor: '#3f6212',
      datalabelsColor: '#14532d',
      datalabelsAnchor: 'end',
      datalabelsAlign: 'end',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 3, borderRadius: 20 },
    dimensions: { width: '800px', height: '600px' },
    category: 'earthy',
    tags: ['green', 'nature', 'earthy'],
    isOfficial: true,
    sortOrder: 5,
  },

  // ── 6. Arctic Line (Line) ─────────────────────────
  {
    id: 'preset-arctic-line',
    name: 'Arctic Line',
    description: 'Clean ice-blue line chart with subtle area fill',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#0ea5e9',
      baseColors: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
      baseBorderColors: ['#0284c7'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      scales: axisScales({ gridColor: '#f0f9ff', tickColor: '#0369a1', axisColor: '#bae6fd' }),
      titleColor: '#0c4a6e',
      subtitleColor: '#0369a1',
      legendColor: '#0369a1',
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'minimal',
    tags: ['line', 'blue', 'area', 'clean'],
    isOfficial: true,
    sortOrder: 6,
  },

  // ── 7. Pulse Line (Line) ──────────────────────────
  {
    id: 'preset-pulse-line',
    name: 'Pulse Line',
    description: 'Bold neon lines on a dark gradient background',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#00f5d4',
      baseColors: ['#00f5d4', '#9b5de5', '#f15bb5'],
      baseBorderColors: ['#00f5d4'],
    },
    configSnapshot: buildConfig({
      fillArea: false,
      showBorder: true,
      background: { type: 'gradient', gradientType: 'linear', gradientDirection: 'to bottom', gradientColor1: '#0f0f23', gradientColor2: '#1e1b4b', opacity: 100 },
      scales: axisScales({ gridColor: 'rgba(255,255,255,0.06)', tickColor: 'rgba(255,255,255,0.5)', axisColor: 'rgba(255,255,255,0.1)' }),
      titleColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.5)',
      legendColor: 'rgba(255,255,255,0.7)',
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 3, tension: 0.3, fill: false, pointRadius: 5, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'dark',
    tags: ['line', 'neon', 'dark', 'bold'],
    isOfficial: true,
    sortOrder: 7,
  },

  // ── 8. Candy Donut (Doughnut) ─────────────────────
  {
    id: 'preset-candy-donut',
    name: 'Candy Donut',
    description: 'Playful pastel doughnut with soft colors',
    chartType: 'doughnut',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#f9a8d4', '#a5f3fc', '#c4b5fd', '#fde68a', '#bbf7d0', '#fecaca', '#e9d5ff', '#bfdbfe'],
      baseBorderColors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fdf2f8', opacity: 100 },
      titleColor: '#831843',
      subtitleColor: '#9d174d',
      legendColor: '#9d174d',
      legendPosition: 'bottom',
      datalabelsColor: '#1f2937',
      datalabelsFontSize: 13,
      hoverFade: true,
    }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 12 },
    dimensions: { width: '700px', height: '700px' },
    category: 'pastel',
    tags: ['doughnut', 'pastel', 'playful', 'candy'],
    isOfficial: true,
    sortOrder: 8,
  },

  // ── 9. Corporate Pie (Pie) ────────────────────────
  {
    id: 'preset-corporate-pie',
    name: 'Corporate Pie',
    description: 'Professional blue-gray pie chart for business use',
    chartType: 'pie',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#1e40af', '#3b82f6', '#93c5fd', '#6b7280', '#dc2626', '#9ca3af', '#1d4ed8', '#60a5fa'],
      baseBorderColors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    },
    configSnapshot: buildConfig({
      titleColor: '#111827',
      subtitleColor: '#4b5563',
      legendColor: '#374151',
      legendPosition: 'right',
      datalabelsColor: '#ffffff',
      datalabelsFontSize: 14,
    }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 8 },
    dimensions: { width: '750px', height: '600px' },
    category: 'professional',
    tags: ['pie', 'professional', 'corporate', 'blue'],
    isOfficial: true,
    sortOrder: 9,
  },

  // ── 10. Gem Radar (Radar) ─────────────────────────
  {
    id: 'preset-gem-radar',
    name: 'Gem Radar',
    description: 'Jewel-toned radar chart on a dark background',
    chartType: 'radar',
    colorStrategy: {
      mode: 'single',
      singleColor: '#8b5cf6',
      baseColors: ['#8b5cf6', '#06b6d4', '#10b981'],
      baseBorderColors: ['#8b5cf6'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      background: { type: 'color', color: '#0f172a', opacity: 100 },
      titleColor: '#e2e8f0',
      subtitleColor: '#94a3b8',
      legendColor: '#cbd5e1',
      legendPosition: 'bottom',
      datalabelsDisplay: false,
      scales: {
        r: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#cbd5e1', font: { size: 12 } },
          ticks: { display: false },
        },
      },
    }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 },
    dimensions: { width: '700px', height: '700px' },
    category: 'dark',
    tags: ['radar', 'dark', 'jewel', 'web'],
    isOfficial: true,
    sortOrder: 10,
  },

  // ── 11. Polar Glow (Polar Area) ───────────────────
  {
    id: 'preset-polar-glow',
    name: 'Polar Glow',
    description: 'Warm sunset tones in a polar area chart',
    chartType: 'polarArea',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#f59e0b', '#14b8a6'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'gradient', gradientType: 'radial', gradientColor1: '#1e1b4b', gradientColor2: '#0f0f23', opacity: 100 },
      titleColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.6)',
      legendColor: 'rgba(255,255,255,0.7)',
      legendPosition: 'bottom',
      datalabelsColor: '#ffffff',
      datalabelsFontSize: 11,
      scales: {
        r: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { display: false },
        },
      },
    }),
    datasetStyle: { borderWidth: 1, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '700px', height: '700px' },
    category: 'gradient',
    tags: ['polar', 'dark', 'sunset', 'glow'],
    isOfficial: true,
    sortOrder: 11,
  },

  // ── 12. Deep 3D Bar (Bar3D) ───────────────────────
  {
    id: 'preset-deep-3d-bar',
    name: 'Deep 3D Bar',
    description: '3D bars with depth on a dark gradient',
    chartType: 'bar3d' as any,
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'gradient', gradientType: 'linear', gradientDirection: 'to bottom', gradientColor1: '#1e1b4b', gradientColor2: '#312e81', opacity: 100 },
      scales: axisScales({ gridColor: 'rgba(255,255,255,0.06)', tickColor: 'rgba(255,255,255,0.5)', axisColor: 'rgba(255,255,255,0.1)' }),
      titleColor: '#e0e7ff',
      subtitleColor: '#a5b4fc',
      legendColor: '#c7d2fe',
      datalabelsColor: '#ffffff',
      bar3d: { enabled: true, depth: 16, darken: 0.2, angle: 45, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 5 },
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '800px', height: '600px' },
    category: '3d',
    tags: ['3d', 'bar', 'dark', 'purple', 'depth'],
    isOfficial: true,
    sortOrder: 12,
  },

  // ── 13. Crystal 3D Pie (Pie3D) ────────────────────
  {
    id: 'preset-crystal-3d-pie',
    name: 'Crystal 3D Pie',
    description: 'Elegant 3D pie with jewel tones and tilt',
    chartType: 'pie3d' as any,
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'],
      baseBorderColors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    },
    configSnapshot: buildConfig({
      titleColor: '#1e293b',
      subtitleColor: '#64748b',
      legendColor: '#475569',
      legendPosition: 'bottom',
      datalabelsColor: '#ffffff',
      datalabelsFontSize: 14,
      pie3d: { enabled: true, depth: 22, darken: 0.25, tilt: 0.7, shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 12, shadowOffsetX: 0, shadowOffsetY: 6 },
    }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 },
    dimensions: { width: '750px', height: '650px' },
    category: '3d',
    tags: ['3d', 'pie', 'jewel', 'crystal'],
    isOfficial: true,
    sortOrder: 13,
  },

  // ── 14. Horizontal Clean (Horizontal Bar) ─────────
  {
    id: 'preset-horizontal-clean',
    name: 'Horizontal Clean',
    description: 'Minimal horizontal bar with a single calm blue',
    chartType: 'horizontalBar',
    colorStrategy: {
      mode: 'single',
      singleColor: '#3b82f6',
      baseColors: ['#3b82f6'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#f8fafc', opacity: 100 },
      scales: axisScales({ gridColor: '#f1f5f9', gridDisplay: true, tickColor: '#64748b', axisColor: '#e2e8f0' }),
      titleColor: '#0f172a',
      subtitleColor: '#64748b',
      legendColor: '#64748b',
      legendDisplay: false,
      datalabelsColor: '#ffffff',
      datalabelsAnchor: 'center',
      datalabelsAlign: 'center',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 4 },
    dimensions: { width: '800px', height: '500px' },
    category: 'minimal',
    tags: ['horizontal', 'minimal', 'clean', 'blue'],
    isOfficial: true,
    sortOrder: 14,
  },

  // ── 15. Stacked Earth (Stacked Bar) ───────────────
  {
    id: 'preset-stacked-earth',
    name: 'Stacked Earth',
    description: 'Earthy stacked bar with warm terracotta tones',
    chartType: 'stackedBar' as any,
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#92400e', '#b45309', '#d97706', '#f59e0b', '#78350f', '#a16207', '#ca8a04', '#eab308'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fefce8', opacity: 100 },
      scales: axisScales({ gridColor: '#fef9c3', tickColor: '#713f12', axisColor: '#fde68a' }),
      titleColor: '#422006',
      subtitleColor: '#713f12',
      legendColor: '#78350f',
      legendPosition: 'bottom',
      datalabelsColor: '#ffffff',
      datalabelsFontSize: 11,
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '800px', height: '600px' },
    category: 'earthy',
    tags: ['stacked', 'earthy', 'warm', 'terracotta'],
    isOfficial: true,
    sortOrder: 15,
  },

  // ══════════════════════════════════════════
  // BATCH 2: Additional Bar Presets (6 more)
  // ══════════════════════════════════════════

  // ── 16. Glass Border Bar ─────────────────────────
  {
    id: 'preset-glass-border-bar',
    name: 'Glass Border',
    description: 'Transparent bars with thick colored borders',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['rgba(59,130,246,0.15)', 'rgba(168,85,247,0.15)', 'rgba(236,72,153,0.15)', 'rgba(34,197,94,0.15)', 'rgba(245,158,11,0.15)', 'rgba(20,184,166,0.15)'],
      baseBorderColors: ['#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#f59e0b', '#14b8a6'],
    },
    configSnapshot: buildConfig({
      scales: { x: { grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } }, y: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#94a3b8' }, border: { display: false } } },
      titleColor: '#1e293b',
      subtitleColor: '#64748b',
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 6 },
    dimensions: { width: '800px', height: '600px' },
    category: 'minimal',
    tags: ['glass', 'border', 'transparent', 'modern'],
    isOfficial: true,
    sortOrder: 16,
  },

  // ── 17. Flat Minimal Bar ─────────────────────────
  {
    id: 'preset-flat-minimal-bar',
    name: 'Flat Minimal',
    description: 'Ultra-clean flat bars with no grid, no legend, no labels',
    chartType: 'bar',
    colorStrategy: {
      mode: 'single',
      singleColor: '#6366f1',
      baseColors: ['#6366f1'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fafafa', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 10 } }, border: { display: false } }, y: { display: false } },
      titleColor: '#18181b',
      titleFont: { size: 16, weight: '600' },
      subtitleDisplay: false,
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 3 },
    dimensions: { width: '800px', height: '500px' },
    category: 'minimal',
    tags: ['flat', 'minimal', 'clean', 'simple'],
    isOfficial: true,
    sortOrder: 17,
  },

  // ── 18. Data Dense Bar ───────────────────────────
  {
    id: 'preset-data-dense-bar',
    name: 'Data Dense',
    description: 'Maximum data visibility with prominent labels and gridlines',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#e11d48', '#15803d'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      scales: {
        x: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 11, weight: 'bold' } }, border: { color: '#9ca3af' } },
        y: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 11 } }, border: { color: '#9ca3af' } },
      },
      titleColor: '#111827',
      titleFont: { size: 16, weight: '700' },
      subtitleColor: '#6b7280',
      legendPosition: 'top',
      legendColor: '#374151',
      legendPointStyle: 'circle',
      datalabelsAnchor: 'end',
      datalabelsAlign: 'end',
      datalabelsColor: '#111827',
      datalabelsFontSize: 11,
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 2 },
    dimensions: { width: '900px', height: '600px' },
    category: 'professional',
    tags: ['data', 'dense', 'labels', 'professional'],
    isOfficial: true,
    sortOrder: 18,
  },

  // ── 19. Rounded Pastel Bar ───────────────────────
  {
    id: 'preset-rounded-pastel-bar',
    name: 'Rounded Pastel',
    description: 'Soft pastel pill-shaped bars on a warm background',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#93c5fd', '#c4b5fd', '#fca5a1', '#a7f3d0', '#fde68a', '#fbcfe8', '#99f6e4', '#fed7aa'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#fffbf5', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: '#78716c' }, border: { display: false } }, y: { display: false } },
      titleColor: '#44403c',
      subtitleColor: '#78716c',
      legendDisplay: false,
      datalabelsColor: '#57534e',
      datalabelsAnchor: 'end',
      datalabelsAlign: 'end',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 20 },
    dimensions: { width: '800px', height: '550px' },
    category: 'pastel',
    tags: ['rounded', 'pastel', 'soft', 'pill'],
    isOfficial: true,
    sortOrder: 19,
  },

  // ── 20. Gradient Dark Bar ────────────────────────
  {
    id: 'preset-gradient-dark-bar',
    name: 'Gradient Dark',
    description: 'Deep gradient background with glowing accent bars',
    chartType: 'bar',
    colorStrategy: {
      mode: 'slice',
      singleColor: null,
      baseColors: ['#22d3ee', '#a78bfa', '#fb923c', '#34d399', '#f472b6', '#facc15', '#38bdf8', '#c084fc'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'gradient', gradientType: 'linear', gradientDirection: '180deg', gradientColor1: '#0c0a09', gradientColor2: '#1c1917', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { color: 'rgba(255,255,255,0.1)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { display: false } } },
      titleColor: '#fafaf9',
      subtitleColor: 'rgba(255,255,255,0.5)',
      legendPosition: 'bottom',
      legendColor: 'rgba(255,255,255,0.6)',
      datalabelsColor: '#ffffff',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 8 },
    dimensions: { width: '800px', height: '600px' },
    category: 'dark',
    tags: ['gradient', 'dark', 'glow', 'modern'],
    isOfficial: true,
    sortOrder: 20,
  },

  // ── 21. Corporate Blue Bar ───────────────────────
  {
    id: 'preset-corporate-blue-bar',
    name: 'Corporate Blue',
    description: 'Professional single-color bar for business decks',
    chartType: 'bar',
    colorStrategy: {
      mode: 'single',
      singleColor: '#1e40af',
      baseColors: ['#1e40af'],
      baseBorderColors: [],
    },
    configSnapshot: buildConfig({
      background: { type: 'color', color: '#ffffff', opacity: 100 },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#374151', font: { size: 11 } }, border: { color: '#d1d5db' } },
        y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 } }, border: { display: false } },
      },
      titleColor: '#111827',
      titleFont: { size: 18, weight: '700' },
      subtitleColor: '#6b7280',
      legendDisplay: false,
      datalabelsAnchor: 'end',
      datalabelsAlign: 'end',
      datalabelsColor: '#1e40af',
    }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 4 },
    dimensions: { width: '800px', height: '600px' },
    category: 'professional',
    tags: ['corporate', 'blue', 'professional', 'business'],
    isOfficial: true,
    sortOrder: 21,
  },

  // ══════════════════════════════════════════
  // BATCH 3: Additional Line Presets (8 more → total 10)
  // ══════════════════════════════════════════

  // ── 22. Smooth Gradient Area Line ────────────────
  {
    id: 'preset-smooth-gradient-line',
    name: 'Smooth Gradient',
    description: 'Silky smooth line with gradient area fill',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#8b5cf6',
      baseColors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      baseBorderColors: ['#7c3aed'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      scales: { x: { grid: { display: false }, ticks: { color: '#a78bfa' }, border: { display: false } }, y: { grid: { color: '#f5f3ff' }, ticks: { color: '#8b5cf6' }, border: { display: false } } },
      titleColor: '#4c1d95',
      subtitleColor: '#7c3aed',
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 3, tension: 0.45, fill: true, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '800px', height: '450px' },
    category: 'gradient',
    tags: ['line', 'gradient', 'smooth', 'area'],
    isOfficial: true,
    sortOrder: 22,
  },

  // ── 23. Stepped Line ─────────────────────────────
  {
    id: 'preset-stepped-line',
    name: 'Stepped Line',
    description: 'Crisp stepped line for discrete data transitions',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#059669',
      baseColors: ['#059669'],
      baseBorderColors: ['#047857'],
    },
    configSnapshot: buildConfig({
      fillArea: false,
      scales: {
        x: { grid: { color: '#ecfdf5' }, ticks: { color: '#065f46' }, border: { color: '#a7f3d0' } },
        y: { grid: { color: '#ecfdf5' }, ticks: { color: '#065f46' }, border: { color: '#a7f3d0' } },
      },
      titleColor: '#064e3b',
      subtitleColor: '#047857',
      legendColor: '#047857',
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 4, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'professional',
    tags: ['line', 'stepped', 'discrete', 'green'],
    isOfficial: true,
    sortOrder: 23,
  },

  // ── 24. Sparkline Minimal ────────────────────────
  {
    id: 'preset-sparkline-minimal',
    name: 'Sparkline',
    description: 'Ultra-minimal line with no axes, grid, or labels',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#ef4444',
      baseColors: ['#ef4444'],
      baseBorderColors: ['#dc2626'],
    },
    configSnapshot: buildConfig({
      fillArea: false,
      scales: { x: { display: false }, y: { display: false } },
      titleColor: '#991b1b',
      subtitleDisplay: false,
      legendDisplay: false,
      datalabelsDisplay: false,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
    }),
    datasetStyle: { borderWidth: 2, tension: 0.4, fill: false, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '400px', height: '200px' },
    category: 'minimal',
    tags: ['line', 'sparkline', 'minimal', 'tiny'],
    isOfficial: true,
    sortOrder: 24,
  },

  // ── 25. Thick Ribbon Line ────────────────────────
  {
    id: 'preset-thick-ribbon-line',
    name: 'Thick Ribbon',
    description: 'Bold thick line with large data points',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#f97316',
      baseColors: ['#f97316', '#fb923c'],
      baseBorderColors: ['#ea580c'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      background: { type: 'color', color: '#fff7ed', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: '#9a3412' }, border: { display: false } }, y: { grid: { color: '#fed7aa' }, ticks: { color: '#9a3412' }, border: { display: false } } },
      titleColor: '#7c2d12',
      subtitleColor: '#c2410c',
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 5, tension: 0.3, fill: true, pointRadius: 6, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'bold',
    tags: ['line', 'thick', 'ribbon', 'bold'],
    isOfficial: true,
    sortOrder: 25,
  },

  // ── 26. Dotted Points Line ───────────────────────
  {
    id: 'preset-dotted-points-line',
    name: 'Dotted Points',
    description: 'Thin dashed line emphasizing individual data points',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#0284c7',
      baseColors: ['#0284c7'],
      baseBorderColors: ['#0369a1'],
    },
    configSnapshot: buildConfig({
      fillArea: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#475569' }, border: { color: '#cbd5e1' } },
        y: { grid: { color: '#f1f5f9' }, ticks: { color: '#475569' }, border: { display: false } },
      },
      titleColor: '#0c4a6e',
      subtitleColor: '#475569',
      legendColor: '#475569',
      datalabelsColor: '#0c4a6e',
      datalabelsAnchor: 'end',
      datalabelsAlign: 'top',
    }),
    datasetStyle: { borderWidth: 1, tension: 0, fill: false, pointRadius: 6, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'minimal',
    tags: ['line', 'dotted', 'points', 'data'],
    isOfficial: true,
    sortOrder: 26,
  },

  // ── 27. Neon Glow Line ───────────────────────────
  {
    id: 'preset-neon-glow-line',
    name: 'Neon Glow',
    description: 'Electric cyan line on pitch-black background',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#22d3ee',
      baseColors: ['#22d3ee'],
      baseBorderColors: ['#06b6d4'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      background: { type: 'color', color: '#020617', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' }, border: { display: false } }, y: { grid: { color: 'rgba(34,211,238,0.08)' }, ticks: { color: 'rgba(255,255,255,0.4)' }, border: { display: false } } },
      titleColor: '#22d3ee',
      subtitleColor: 'rgba(255,255,255,0.4)',
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 3, tension: 0.4, fill: true, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '800px', height: '450px' },
    category: 'dark',
    tags: ['line', 'neon', 'glow', 'dark', 'cyan'],
    isOfficial: true,
    sortOrder: 27,
  },

  // ── 28. Warm Earth Line ──────────────────────────
  {
    id: 'preset-warm-earth-line',
    name: 'Warm Earth Line',
    description: 'Earthy brown tones with subtle area fill',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#92400e',
      baseColors: ['#92400e', '#b45309'],
      baseBorderColors: ['#78350f'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      background: { type: 'color', color: '#fefce8', opacity: 100 },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#78350f' }, border: { color: '#fde68a' } },
        y: { grid: { color: '#fef9c3' }, ticks: { color: '#78350f' }, border: { display: false } },
      },
      titleColor: '#451a03',
      subtitleColor: '#92400e',
      legendColor: '#78350f',
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3, borderRadius: 0 },
    dimensions: { width: '800px', height: '500px' },
    category: 'earthy',
    tags: ['line', 'earth', 'warm', 'brown'],
    isOfficial: true,
    sortOrder: 28,
  },

  // ── 29. Pastel Wave Line ─────────────────────────
  {
    id: 'preset-pastel-wave-line',
    name: 'Pastel Wave',
    description: 'Soft pink pastel line on a gentle pink background',
    chartType: 'line',
    colorStrategy: {
      mode: 'single',
      singleColor: '#ec4899',
      baseColors: ['#ec4899', '#f9a8d4'],
      baseBorderColors: ['#db2777'],
    },
    configSnapshot: buildConfig({
      fillArea: true,
      background: { type: 'color', color: '#fdf2f8', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: '#9d174d' }, border: { display: false } }, y: { grid: { color: '#fce7f3' }, ticks: { color: '#9d174d' }, border: { display: false } } },
      titleColor: '#831843',
      subtitleColor: '#be185d',
      legendDisplay: false,
      datalabelsDisplay: false,
    }),
    datasetStyle: { borderWidth: 3, tension: 0.5, fill: true, pointRadius: 0, borderRadius: 0 },
    dimensions: { width: '800px', height: '450px' },
    category: 'pastel',
    tags: ['line', 'pastel', 'pink', 'wave'],
    isOfficial: true,
    sortOrder: 29,
  },

  // ══════════════════════════════════════════
  // BATCH 4: Additional Pie Presets (9 more → total 10)
  // ══════════════════════════════════════════

  { id: 'preset-pastel-pie', name: 'Pastel Pie', description: 'Soft pastel pie with bottom legend', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#93c5fd','#c4b5fd','#fca5a1','#a7f3d0','#fde68a','#fbcfe8','#99f6e4','#fed7aa'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefce8', opacity: 100 }, titleColor: '#44403c', subtitleColor: '#78716c', legendPosition: 'bottom', legendColor: '#57534e', datalabelsColor: '#44403c', datalabelsFontSize: 12 }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'pastel', tags: ['pie','pastel','soft'], isOfficial: true, sortOrder: 30 },

  { id: 'preset-neon-pie', name: 'Neon Pie', description: 'Vibrant neon pie on dark background', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#00f5d4','#f72585','#fee440','#7b2ff7','#00bbf9','#fb5607','#8338ec','#ff006e'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#0f172a', opacity: 100 }, titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.5)', legendPosition: 'right', legendColor: 'rgba(255,255,255,0.7)', datalabelsColor: '#ffffff', datalabelsFontSize: 13 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 15 }, dimensions: { width: '750px', height: '650px' }, category: 'dark', tags: ['pie','neon','dark'], isOfficial: true, sortOrder: 31 },

  { id: 'preset-minimalist-pie', name: 'Minimalist Pie', description: 'No labels, no legend — just the chart', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#e2e8f0','#cbd5e1','#94a3b8','#64748b','#475569','#334155','#1e293b','#0f172a'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#0f172a', subtitleDisplay: false, legendDisplay: false, datalabelsDisplay: false }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 8 }, dimensions: { width: '600px', height: '600px' }, category: 'minimal', tags: ['pie','minimal','clean'], isOfficial: true, sortOrder: 32 },

  { id: 'preset-earth-tone-pie', name: 'Earth Tone Pie', description: 'Warm earthy colors with outside labels', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#92400e','#b45309','#d97706','#78350f','#a16207','#ca8a04','#854d0e','#713f12'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefdf5', opacity: 100 }, titleColor: '#422006', subtitleColor: '#713f12', legendPosition: 'bottom', legendColor: '#78350f', datalabelsColor: '#ffffff', datalabelsFontSize: 13 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'earthy', tags: ['pie','earthy','warm'], isOfficial: true, sortOrder: 33 },

  { id: 'preset-bold-contrast-pie', name: 'Bold Contrast Pie', description: 'High contrast bold colors with thick white borders', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#dc2626','#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#c026d3','#65a30d'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#111827', titleFont: { size: 20, weight: '800' }, subtitleColor: '#6b7280', legendPosition: 'right', legendColor: '#374151', datalabelsColor: '#ffffff', datalabelsFontSize: 14 }),
    datasetStyle: { borderWidth: 4, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 12 }, dimensions: { width: '800px', height: '650px' }, category: 'bold', tags: ['pie','bold','contrast'], isOfficial: true, sortOrder: 34 },

  { id: 'preset-gradient-pie', name: 'Gradient Pie', description: 'Pie on a purple gradient background', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#818cf8','#fb923c','#34d399','#f472b6','#facc15','#22d3ee','#a78bfa','#f87171'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'linear', gradientDirection: '135deg', gradientColor1: '#1e1b4b', gradientColor2: '#312e81', opacity: 100 }, titleColor: '#e0e7ff', subtitleColor: '#a5b4fc', legendPosition: 'bottom', legendColor: '#c7d2fe', datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'gradient', tags: ['pie','gradient','purple'], isOfficial: true, sortOrder: 35 },

  { id: 'preset-monochrome-pie', name: 'Monochrome Pie', description: 'Single-hue blue pie with right legend', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#1e3a5f','#1e40af','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#1e3a5f', subtitleColor: '#1e40af', legendPosition: 'right', legendColor: '#1e40af', datalabelsDisplay: false }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 8 }, dimensions: { width: '800px', height: '600px' }, category: 'professional', tags: ['pie','monochrome','blue'], isOfficial: true, sortOrder: 36 },

  { id: 'preset-flat-pie', name: 'Flat Pie', description: 'No borders, no hover, flat modern look', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#6366f1','#ec4899','#f59e0b','#10b981','#ef4444','#8b5cf6','#14b8a6','#f97316'], baseBorderColors: [] },
    configSnapshot: buildConfig({ titleColor: '#18181b', subtitleDisplay: false, legendPosition: 'top', legendColor: '#52525b', datalabelsColor: '#ffffff', datalabelsFontSize: 12 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 0 }, dimensions: { width: '650px', height: '650px' }, category: 'minimal', tags: ['pie','flat','modern'], isOfficial: true, sortOrder: 37 },

  { id: 'preset-elegant-pie', name: 'Elegant Pie', description: 'Thin borders with a soft cream background', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#0d9488','#0891b2','#0284c7','#4f46e5','#7c3aed','#c026d3','#db2777','#e11d48'], baseBorderColors: ['#fefce8','#fefce8','#fefce8','#fefce8','#fefce8','#fefce8','#fefce8','#fefce8'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefce8', opacity: 100 }, titleColor: '#1c1917', titleFont: { size: 16, weight: '600' }, subtitleColor: '#57534e', legendPosition: 'bottom', legendColor: '#44403c', datalabelsColor: '#ffffff', datalabelsFontSize: 11 }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 6 }, dimensions: { width: '700px', height: '700px' }, category: 'professional', tags: ['pie','elegant','cream'], isOfficial: true, sortOrder: 38 },

  // ══════════════════════════════════════════
  // BATCH 5: Additional Doughnut Presets (9 more → total 10)
  // ══════════════════════════════════════════

  { id: 'preset-dark-donut', name: 'Dark Donut', description: 'Sleek doughnut on a dark background', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#818cf8','#fb923c','#34d399','#f472b6','#facc15','#22d3ee','#a78bfa','#f87171'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#0f172a', opacity: 100 }, titleColor: '#f1f5f9', subtitleColor: '#94a3b8', legendPosition: 'right', legendColor: '#cbd5e1', datalabelsColor: '#ffffff', datalabelsFontSize: 12 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 12 }, dimensions: { width: '750px', height: '650px' }, category: 'dark', tags: ['doughnut','dark','sleek'], isOfficial: true, sortOrder: 39 },

  { id: 'preset-thin-ring-donut', name: 'Thin Ring', description: 'Ultra-thin ring doughnut for KPI dashboards', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#3b82f6','#e5e7eb','#f3f4f6'], baseBorderColors: [] },
    configSnapshot: buildConfig({ titleColor: '#111827', subtitleDisplay: false, legendDisplay: false, datalabelsDisplay: false }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 4 }, dimensions: { width: '400px', height: '400px' }, category: 'minimal', tags: ['doughnut','thin','kpi','dashboard'], isOfficial: true, sortOrder: 40 },

  { id: 'preset-neon-donut', name: 'Neon Donut', description: 'Vibrant neon segments on pitch black', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#00f5d4','#f72585','#fee440','#7b2ff7','#00bbf9','#fb5607'], baseBorderColors: ['#020617','#020617','#020617','#020617','#020617','#020617'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#020617', opacity: 100 }, titleColor: '#f0abfc', subtitleColor: 'rgba(255,255,255,0.4)', legendPosition: 'bottom', legendColor: 'rgba(255,255,255,0.6)', datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 15 }, dimensions: { width: '700px', height: '700px' }, category: 'dark', tags: ['doughnut','neon','dark'], isOfficial: true, sortOrder: 41 },

  { id: 'preset-corporate-donut', name: 'Corporate Donut', description: 'Professional blue-gray for business reports', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#1e40af','#3b82f6','#93c5fd','#6b7280','#9ca3af','#d1d5db'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#111827', titleFont: { size: 18, weight: '700' }, subtitleColor: '#4b5563', legendPosition: 'right', legendColor: '#374151', datalabelsColor: '#ffffff', datalabelsFontSize: 13 }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 8 }, dimensions: { width: '800px', height: '600px' }, category: 'professional', tags: ['doughnut','corporate','business'], isOfficial: true, sortOrder: 42 },

  { id: 'preset-earth-donut', name: 'Earth Donut', description: 'Warm earthy tones with bottom legend', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#92400e','#b45309','#d97706','#f59e0b','#78350f','#a16207','#ca8a04','#eab308'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fffbeb', opacity: 100 }, titleColor: '#451a03', subtitleColor: '#78350f', legendPosition: 'bottom', legendColor: '#92400e', datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'earthy', tags: ['doughnut','earthy','warm'], isOfficial: true, sortOrder: 43 },

  { id: 'preset-bold-donut', name: 'Bold Donut', description: 'Thick borders with high contrast palette', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#dc2626','#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#c026d3','#65a30d'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#111827', titleFont: { size: 20, weight: '800' }, subtitleColor: '#6b7280', legendDisplay: false, datalabelsColor: '#ffffff', datalabelsFontSize: 14 }),
    datasetStyle: { borderWidth: 5, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 14 }, dimensions: { width: '700px', height: '700px' }, category: 'bold', tags: ['doughnut','bold','contrast'], isOfficial: true, sortOrder: 44 },

  { id: 'preset-gradient-donut', name: 'Gradient Donut', description: 'Doughnut on a warm orange gradient', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#fef3c7','#fde68a','#fcd34d','#fbbf24','#f59e0b','#d97706','#b45309','#92400e'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'linear', gradientDirection: '135deg', gradientColor1: '#7c2d12', gradientColor2: '#431407', opacity: 100 }, titleColor: '#fef3c7', subtitleColor: '#fde68a', legendPosition: 'bottom', legendColor: '#fde68a', datalabelsColor: '#451a03' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'gradient', tags: ['doughnut','gradient','orange'], isOfficial: true, sortOrder: 45 },

  { id: 'preset-minimal-donut', name: 'Minimal Donut', description: 'Clean minimal with no labels or legend', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#6366f1','#a5b4fc','#e0e7ff','#c7d2fe','#818cf8'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#312e81', subtitleDisplay: false, legendDisplay: false, datalabelsDisplay: false }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 6 }, dimensions: { width: '500px', height: '500px' }, category: 'minimal', tags: ['doughnut','minimal','clean'], isOfficial: true, sortOrder: 46 },

  { id: 'preset-pastel-donut', name: 'Pastel Donut', description: 'Soft pastel doughnut with pink background', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#c4b5fd','#a5f3fc','#fca5a1','#bbf7d0','#fde68a','#fbcfe8','#99f6e4','#fecaca'], baseBorderColors: ['#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fdf2f8', opacity: 100 }, titleColor: '#831843', subtitleColor: '#9d174d', legendPosition: 'top', legendColor: '#9d174d', datalabelsColor: '#1f2937', datalabelsFontSize: 11, hoverFade: true }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'pastel', tags: ['doughnut','pastel','pink'], isOfficial: true, sortOrder: 47 },

  // ══════════════════════════════════════════
  // BATCH 6: Additional Radar Presets (9 more → total 10)
  // ══════════════════════════════════════════

  { id: 'preset-frost-radar', name: 'Frost Radar', description: 'Icy blue radar with translucent fill on white', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#0ea5e9', baseColors: ['#0ea5e9','#38bdf8','#7dd3fc'], baseBorderColors: ['#0284c7'] },
    configSnapshot: buildConfig({ fillArea: true, titleColor: '#0c4a6e', subtitleColor: '#0369a1', legendColor: '#0369a1', legendPosition: 'top', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#e0f2fe' }, angleLines: { color: '#bae6fd' }, pointLabels: { color: '#0369a1', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'minimal', tags: ['radar','ice','blue','clean'], isOfficial: true, sortOrder: 48 },

  { id: 'preset-neon-web-radar', name: 'Neon Web', description: 'Electric neon radar on a pitch-black canvas', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#00f5d4', baseColors: ['#00f5d4','#f72585','#fee440'], baseBorderColors: ['#00f5d4'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'color', color: '#020617', opacity: 100 }, titleColor: '#00f5d4', subtitleColor: 'rgba(255,255,255,0.4)', legendColor: 'rgba(255,255,255,0.6)', legendPosition: 'bottom', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: 'rgba(0,245,212,0.12)' }, angleLines: { color: 'rgba(0,245,212,0.12)' }, pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: true, pointRadius: 5, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'dark', tags: ['radar','neon','dark','electric'], isOfficial: true, sortOrder: 49 },

  { id: 'preset-corporate-radar', name: 'Corporate Radar', description: 'Professional blue-gray radar for business reports', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#1e40af', baseColors: ['#1e40af','#3b82f6','#93c5fd'], baseBorderColors: ['#1e3a8a'] },
    configSnapshot: buildConfig({ fillArea: true, titleColor: '#111827', titleFont: { size: 18, weight: '700' }, subtitleColor: '#4b5563', legendColor: '#374151', legendPosition: 'top', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#e5e7eb' }, angleLines: { color: '#d1d5db' }, pointLabels: { color: '#374151', font: { size: 12, weight: 'bold' } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '650px' }, category: 'professional', tags: ['radar','corporate','business','blue'], isOfficial: true, sortOrder: 50 },

  { id: 'preset-earth-radar', name: 'Earth Radar', description: 'Warm earthy tones on a creamy background', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#92400e', baseColors: ['#92400e','#b45309','#d97706'], baseBorderColors: ['#78350f'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'color', color: '#fefdf5', opacity: 100 }, titleColor: '#422006', subtitleColor: '#713f12', legendColor: '#78350f', legendPosition: 'bottom', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#fde68a' }, angleLines: { color: '#fcd34d' }, pointLabels: { color: '#78350f', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'earthy', tags: ['radar','earthy','warm','brown'], isOfficial: true, sortOrder: 51 },

  { id: 'preset-pastel-radar', name: 'Pastel Radar', description: 'Soft pastel radar with a gentle pink background', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#f9a8d4', baseColors: ['#f9a8d4','#c4b5fd','#a5f3fc'], baseBorderColors: ['#ec4899'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'color', color: '#fdf2f8', opacity: 100 }, titleColor: '#831843', subtitleColor: '#9d174d', legendColor: '#9d174d', legendPosition: 'top', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#fce7f3' }, angleLines: { color: '#fbcfe8' }, pointLabels: { color: '#9d174d', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'pastel', tags: ['radar','pastel','pink','soft'], isOfficial: true, sortOrder: 52 },

  { id: 'preset-midnight-radar', name: 'Midnight Radar', description: 'Deep indigo radar with purple accents', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#a78bfa', baseColors: ['#a78bfa','#818cf8','#c084fc'], baseBorderColors: ['#7c3aed'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'gradient', gradientType: 'radial', gradientColor1: '#1e1b4b', gradientColor2: '#0f0a2e', opacity: 100 }, titleColor: '#e0e7ff', subtitleColor: '#a5b4fc', legendColor: '#c7d2fe', legendPosition: 'bottom', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: 'rgba(167,139,250,0.15)' }, angleLines: { color: 'rgba(167,139,250,0.15)' }, pointLabels: { color: '#c7d2fe', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 5, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'dark', tags: ['radar','midnight','purple','dark'], isOfficial: true, sortOrder: 53 },

  { id: 'preset-bold-radar', name: 'Bold Radar', description: 'High-contrast radar with thick borders and no fill', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#dc2626', baseColors: ['#dc2626','#2563eb','#16a34a'], baseBorderColors: ['#b91c1c'] },
    configSnapshot: buildConfig({ fillArea: false, titleColor: '#111827', titleFont: { size: 20, weight: '800' }, subtitleColor: '#6b7280', legendColor: '#374151', legendPosition: 'top', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#e5e7eb' }, angleLines: { color: '#d1d5db' }, pointLabels: { color: '#111827', font: { size: 13, weight: 'bold' } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 4, tension: 0, fill: false, pointRadius: 6, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'bold', tags: ['radar','bold','contrast','thick'], isOfficial: true, sortOrder: 54 },

  { id: 'preset-gradient-radar', name: 'Gradient Radar', description: 'Teal radar on a dark ocean gradient', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#14b8a6', baseColors: ['#14b8a6','#2dd4bf','#5eead4'], baseBorderColors: ['#0d9488'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'gradient', gradientType: 'linear', gradientDirection: '180deg', gradientColor1: '#042f2e', gradientColor2: '#0f172a', opacity: 100 }, titleColor: '#5eead4', subtitleColor: '#99f6e4', legendColor: '#99f6e4', legendPosition: 'bottom', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: 'rgba(20,184,166,0.12)' }, angleLines: { color: 'rgba(20,184,166,0.12)' }, pointLabels: { color: '#99f6e4', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'gradient', tags: ['radar','gradient','teal','ocean'], isOfficial: true, sortOrder: 55 },

  { id: 'preset-flat-radar', name: 'Flat Radar', description: 'Ultra-minimal radar with no gridlines or labels', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#6366f1', baseColors: ['#6366f1'], baseBorderColors: ['#4f46e5'] },
    configSnapshot: buildConfig({ fillArea: true, background: { type: 'color', color: '#fafafa', opacity: 100 }, titleColor: '#18181b', titleFont: { size: 16, weight: '600' }, subtitleDisplay: false, legendDisplay: false, datalabelsDisplay: false,
      scales: { r: { display: true, grid: { display: false }, angleLines: { display: false }, pointLabels: { color: '#71717a', font: { size: 11 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 3, borderRadius: 0 }, dimensions: { width: '650px', height: '650px' }, category: 'minimal', tags: ['radar','flat','minimal','clean'], isOfficial: true, sortOrder: 56 },

  // ══════════════════════════════════════════
  // BATCH 7: Additional Polar Area Presets (9 more → total 10)
  // ══════════════════════════════════════════

  { id: 'preset-frost-polar', name: 'Frost Polar', description: 'Icy blues in a clean polar layout', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#0284c7','#0369a1','#e0f2fe','#67e8f9'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#0c4a6e', subtitleColor: '#0369a1', legendPosition: 'top', legendColor: '#0369a1', datalabelsColor: '#0c4a6e', datalabelsFontSize: 11,
      scales: { r: { display: true, grid: { color: '#e0f2fe' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'minimal', tags: ['polar','ice','blue','clean'], isOfficial: true, sortOrder: 57 },

  { id: 'preset-neon-polar', name: 'Neon Polar', description: 'Vivid neon polar segments on pitch black', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#00f5d4','#f72585','#fee440','#7b2ff7','#00bbf9','#fb5607','#8338ec','#ff006e'], baseBorderColors: ['#020617','#020617','#020617','#020617','#020617','#020617','#020617','#020617'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#020617', opacity: 100 }, titleColor: '#f0abfc', subtitleColor: 'rgba(255,255,255,0.4)', legendPosition: 'right', legendColor: 'rgba(255,255,255,0.6)', datalabelsColor: '#ffffff',
      scales: { r: { display: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'dark', tags: ['polar','neon','dark','vivid'], isOfficial: true, sortOrder: 58 },

  { id: 'preset-corporate-polar', name: 'Corporate Polar', description: 'Professional blue-gray polar for business reports', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#1e40af','#3b82f6','#93c5fd','#6b7280','#9ca3af','#d1d5db','#1d4ed8','#60a5fa'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#111827', titleFont: { size: 18, weight: '700' }, subtitleColor: '#4b5563', legendPosition: 'right', legendColor: '#374151', datalabelsColor: '#ffffff', datalabelsFontSize: 12,
      scales: { r: { display: true, grid: { color: '#e5e7eb' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '750px', height: '650px' }, category: 'professional', tags: ['polar','corporate','business','blue'], isOfficial: true, sortOrder: 59 },

  { id: 'preset-earth-polar', name: 'Earth Polar', description: 'Warm earthy polar on a creamy background', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#92400e','#b45309','#d97706','#f59e0b','#78350f','#a16207','#ca8a04','#eab308'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefdf5', opacity: 100 }, titleColor: '#422006', subtitleColor: '#713f12', legendPosition: 'bottom', legendColor: '#78350f', datalabelsColor: '#ffffff',
      scales: { r: { display: true, grid: { color: '#fde68a' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'earthy', tags: ['polar','earthy','warm','brown'], isOfficial: true, sortOrder: 60 },

  { id: 'preset-pastel-polar', name: 'Pastel Polar', description: 'Soft pastel polar with a gentle pink background', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#f9a8d4','#a5f3fc','#c4b5fd','#fde68a','#bbf7d0','#fecaca','#e9d5ff','#bfdbfe'], baseBorderColors: ['#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8','#fdf2f8'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fdf2f8', opacity: 100 }, titleColor: '#831843', subtitleColor: '#9d174d', legendPosition: 'bottom', legendColor: '#9d174d', datalabelsColor: '#1f2937', datalabelsFontSize: 11, hoverFade: true,
      scales: { r: { display: true, grid: { color: '#fce7f3' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'pastel', tags: ['polar','pastel','pink','soft'], isOfficial: true, sortOrder: 61 },

  { id: 'preset-midnight-polar', name: 'Midnight Polar', description: 'Deep indigo polar with purple accents', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#818cf8','#a78bfa','#c084fc','#e879f9','#6366f1','#8b5cf6','#a855f7','#d946ef'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'radial', gradientColor1: '#1e1b4b', gradientColor2: '#0f0a2e', opacity: 100 }, titleColor: '#e0e7ff', subtitleColor: '#a5b4fc', legendPosition: 'bottom', legendColor: '#c7d2fe', datalabelsColor: '#ffffff', datalabelsFontSize: 11,
      scales: { r: { display: true, grid: { color: 'rgba(167,139,250,0.1)' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 1, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'dark', tags: ['polar','midnight','purple','dark'], isOfficial: true, sortOrder: 62 },

  { id: 'preset-bold-polar', name: 'Bold Polar', description: 'High-contrast primary colors with thick white borders', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#dc2626','#2563eb','#16a34a','#9333ea','#ea580c','#0891b2','#c026d3','#65a30d'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#111827', titleFont: { size: 20, weight: '800' }, subtitleColor: '#6b7280', legendPosition: 'right', legendColor: '#374151', datalabelsColor: '#ffffff', datalabelsFontSize: 13,
      scales: { r: { display: true, grid: { color: '#e5e7eb' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 4, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'bold', tags: ['polar','bold','contrast','primary'], isOfficial: true, sortOrder: 63 },

  { id: 'preset-sunrise-polar', name: 'Sunrise Polar', description: 'Warm sunrise gradient with golden-orange tones', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#fbbf24','#f59e0b','#f97316','#ef4444','#fb923c','#fcd34d','#d97706','#dc2626'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'linear', gradientDirection: '180deg', gradientColor1: '#431407', gradientColor2: '#1c0a00', opacity: 100 }, titleColor: '#fef3c7', subtitleColor: '#fde68a', legendPosition: 'bottom', legendColor: '#fde68a', datalabelsColor: '#451a03',
      scales: { r: { display: true, grid: { color: 'rgba(251,191,36,0.1)' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'gradient', tags: ['polar','sunrise','warm','golden'], isOfficial: true, sortOrder: 64 },

  { id: 'preset-flat-polar', name: 'Flat Polar', description: 'Ultra-minimal polar with no grid or legend', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#6366f1','#a5b4fc','#c7d2fe','#e0e7ff','#818cf8','#4f46e5','#312e81','#eef2ff'], baseBorderColors: ['#fafafa','#fafafa','#fafafa','#fafafa','#fafafa','#fafafa','#fafafa','#fafafa'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fafafa', opacity: 100 }, titleColor: '#18181b', titleFont: { size: 16, weight: '600' }, subtitleDisplay: false, legendDisplay: false, datalabelsDisplay: false,
      scales: { r: { display: false } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '600px', height: '600px' }, category: 'minimal', tags: ['polar','flat','minimal','clean'], isOfficial: true, sortOrder: 65 },

  // ══════════════════════════════════════════
  // BATCH 8: Additional Horizontal Bar Presets (9 more → total 10)
  // ══════════════════════════════════════════

  { id: 'preset-neon-horizontal', name: 'Neon Horizontal', description: 'Vivid neon horizontal bars on dark background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#00f5d4','#7b2ff7','#f72585','#fee440','#00bbf9','#fb5607','#8338ec','#ff006e'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#0f172a', opacity: 100 },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' }, border: { display: false } } },
      titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.5)', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 4 }, dimensions: { width: '800px', height: '500px' }, category: 'dark', tags: ['horizontal','neon','dark','vivid'], isOfficial: true, sortOrder: 66 },

  { id: 'preset-corporate-horizontal', name: 'Corporate Horizontal', description: 'Professional single-color horizontal for business decks', chartType: 'horizontalBar',
    colorStrategy: { mode: 'single', singleColor: '#1e40af', baseColors: ['#1e40af'], baseBorderColors: [] },
    configSnapshot: buildConfig({
      scales: { x: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: '#374151', font: { size: 12 } }, border: { color: '#d1d5db' } } },
      titleColor: '#111827', titleFont: { size: 18, weight: '700' }, subtitleColor: '#6b7280', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 4 }, dimensions: { width: '800px', height: '500px' }, category: 'professional', tags: ['horizontal','corporate','blue','business'], isOfficial: true, sortOrder: 67 },

  { id: 'preset-earth-horizontal', name: 'Earth Horizontal', description: 'Warm earthy tones on a creamy background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#92400e','#b45309','#d97706','#f59e0b','#78350f','#a16207','#ca8a04','#eab308'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefdf5', opacity: 100 },
      scales: { x: { grid: { color: '#fef9c3' }, ticks: { color: '#713f12' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: '#78350f' }, border: { display: false } } },
      titleColor: '#422006', subtitleColor: '#713f12', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 6 }, dimensions: { width: '800px', height: '500px' }, category: 'earthy', tags: ['horizontal','earthy','warm','brown'], isOfficial: true, sortOrder: 68 },

  { id: 'preset-pastel-horizontal', name: 'Pastel Horizontal', description: 'Soft pastel pill bars on a gentle background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#93c5fd','#c4b5fd','#fca5a1','#a7f3d0','#fde68a','#fbcfe8','#99f6e4','#fed7aa'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fffbf5', opacity: 100 },
      scales: { x: { grid: { display: false }, ticks: { color: '#78716c' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: '#78716c' }, border: { display: false } } },
      titleColor: '#44403c', subtitleColor: '#78716c', legendDisplay: false, datalabelsColor: '#57534e' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 20 }, dimensions: { width: '800px', height: '500px' }, category: 'pastel', tags: ['horizontal','pastel','soft','pill'], isOfficial: true, sortOrder: 69 },

  { id: 'preset-dark-horizontal', name: 'Dark Horizontal', description: 'Sleek horizontal bars on a deep dark background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#818cf8','#fb923c','#34d399','#f472b6','#facc15','#22d3ee','#a78bfa','#f87171'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'linear', gradientDirection: '180deg', gradientColor1: '#0c0a09', gradientColor2: '#1c1917', opacity: 100 },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)' }, border: { display: false } } },
      titleColor: '#fafaf9', subtitleColor: 'rgba(255,255,255,0.5)', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 8 }, dimensions: { width: '800px', height: '500px' }, category: 'dark', tags: ['horizontal','dark','gradient','modern'], isOfficial: true, sortOrder: 70 },

  { id: 'preset-rounded-horizontal', name: 'Rounded Horizontal', description: 'Pill-shaped bars with a fresh green accent', chartType: 'horizontalBar',
    colorStrategy: { mode: 'single', singleColor: '#22c55e', baseColors: ['#22c55e'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#f0fdf4', opacity: 100 },
      scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: '#166534', font: { size: 12, weight: 'bold' } }, border: { display: false } } },
      titleColor: '#14532d', subtitleColor: '#166534', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 20 }, dimensions: { width: '800px', height: '450px' }, category: 'minimal', tags: ['horizontal','rounded','green','pill'], isOfficial: true, sortOrder: 71 },

  { id: 'preset-data-dense-horizontal', name: 'Data Dense Horizontal', description: 'Maximum data visibility with prominent labels and gridlines', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#2563eb','#dc2626','#16a34a','#ca8a04','#9333ea','#0891b2','#e11d48','#15803d'], baseBorderColors: [] },
    configSnapshot: buildConfig({
      scales: { x: { grid: { display: true, color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 11 } }, border: { color: '#9ca3af' } }, y: { grid: { display: false }, ticks: { color: '#374151', font: { size: 11, weight: 'bold' } }, border: { color: '#9ca3af' } } },
      titleColor: '#111827', titleFont: { size: 16, weight: '700' }, subtitleColor: '#6b7280', legendPosition: 'top', legendColor: '#374151', datalabelsColor: '#111827', datalabelsFontSize: 11 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 2 }, dimensions: { width: '900px', height: '600px' }, category: 'professional', tags: ['horizontal','data','dense','labels'], isOfficial: true, sortOrder: 72 },

  { id: 'preset-glass-horizontal', name: 'Glass Horizontal', description: 'Transparent bars with thick colored borders', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['rgba(59,130,246,0.15)','rgba(168,85,247,0.15)','rgba(236,72,153,0.15)','rgba(34,197,94,0.15)','rgba(245,158,11,0.15)','rgba(20,184,166,0.15)'], baseBorderColors: ['#3b82f6','#a855f7','#ec4899','#22c55e','#f59e0b','#14b8a6'] },
    configSnapshot: buildConfig({
      scales: { x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } } },
      titleColor: '#1e293b', subtitleColor: '#64748b', legendDisplay: false, datalabelsDisplay: false }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 6 }, dimensions: { width: '800px', height: '500px' }, category: 'minimal', tags: ['horizontal','glass','border','transparent'], isOfficial: true, sortOrder: 73 },

  { id: 'preset-gradient-horizontal', name: 'Gradient Horizontal', description: 'Glowing bars on a deep gradient background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#22d3ee','#a78bfa','#fb923c','#34d399','#f472b6','#facc15','#38bdf8','#c084fc'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'gradient', gradientType: 'linear', gradientDirection: '135deg', gradientColor1: '#0f0f23', gradientColor2: '#1a1a3e', opacity: 100 },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' }, border: { display: false } } },
      titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.5)', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 6 }, dimensions: { width: '800px', height: '500px' }, category: 'gradient', tags: ['horizontal','gradient','dark','glow'], isOfficial: true, sortOrder: 74 },
]

/**
 * Get all official preset defaults.
 */
export function getOfficialPresets(): ChartStylePreset[] {
  return CHART_STYLE_PRESETS
}

/**
 * Find a preset by ID.
 */
export function getPresetById(id: string): ChartStylePreset | undefined {
  return CHART_STYLE_PRESETS.find(p => p.id === id)
}

/**
 * Filter presets by chart type.
 */
export function getPresetsByChartType(chartType: string): ChartStylePreset[] {
  return CHART_STYLE_PRESETS.filter(p => p.chartType === chartType)
}

/**
 * Filter presets by category.
 */
export function getPresetsByCategory(category: string): ChartStylePreset[] {
  return CHART_STYLE_PRESETS.filter(p => p.category === category)
}
