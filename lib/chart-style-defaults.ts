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
        display: overrides.subtitleDisplay ?? false,
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
  xTitle?: string; yTitle?: string; titleColor?: string;
} = {}): Record<string, any> {
  return {
    x: {
      display: opts.xDisplay ?? true,
      grid: { display: opts.gridDisplay ?? true, color: opts.gridColor || '#e5e7eb' },
      ticks: { color: opts.tickColor || '#6b7280', font: { size: 11 } },
      border: { display: true, color: opts.axisColor || '#d1d5db' },
      ...(opts.xTitle ? { title: { display: true, text: opts.xTitle, color: opts.titleColor || opts.tickColor || '#6b7280', font: { size: 12, weight: '600' } } } : {}),
    },
    y: {
      display: opts.yDisplay ?? true,
      beginAtZero: opts.beginAtZero ?? true,
      grid: { display: opts.gridDisplay ?? true, color: opts.gridColor || '#e5e7eb' },
      ticks: { color: opts.tickColor || '#6b7280', font: { size: 11 } },
      border: { display: true, color: opts.axisColor || '#d1d5db' },
      ...(opts.yTitle ? { title: { display: true, text: opts.yTitle, color: opts.titleColor || opts.tickColor || '#6b7280', font: { size: 12, weight: '600' } } } : {}),
    },
  }
}

// =====================================================
// THE 15 OFFICIAL PRESETS
// =====================================================

export const CHART_STYLE_PRESETS: ChartStylePreset[] = [
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
      scales: axisScales({ gridColor: '#e0f2fe', tickColor: '#0369a1', axisColor: '#bae6fd', xTitle: 'Category', yTitle: 'Value', titleColor: '#0369a1' }),
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
        x: { grid: { display: false }, ticks: { color: '#92400e' }, border: { color: '#fde68a' }, title: { display: true, text: 'Items', color: '#92400e', font: { size: 12, weight: '600' } } },
        y: { grid: { color: '#fef3c7' }, ticks: { color: '#92400e' }, border: { display: false }, title: { display: true, text: 'Count', color: '#92400e', font: { size: 12, weight: '600' } } }
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
      scales: axisScales({ gridColor: '#f0f9ff', tickColor: '#0369a1', axisColor: '#bae6fd', xTitle: 'Period', yTitle: 'Value', titleColor: '#0369a1' }),
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
      scales: axisScales({ gridColor: 'rgba(255,255,255,0.06)', tickColor: 'rgba(255,255,255,0.5)', axisColor: 'rgba(255,255,255,0.1)', xTitle: 'Time', yTitle: 'Amplitude', titleColor: 'rgba(255,255,255,0.4)' }),
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

  { id: 'preset-dark-donut', name: 'Dark Donut', description: 'Sleek doughnut on a dark background', chartType: 'doughnut',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#818cf8','#fb923c','#34d399','#f472b6','#facc15','#22d3ee','#a78bfa','#f87171'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#0f172a', opacity: 100 }, titleColor: '#f1f5f9', subtitleColor: '#94a3b8', legendPosition: 'right', legendColor: '#cbd5e1', datalabelsColor: '#ffffff', datalabelsFontSize: 12 }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 12 }, dimensions: { width: '750px', height: '650px' }, category: 'dark', tags: ['doughnut','dark','sleek'], isOfficial: true, sortOrder: 39 },

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

  { id: 'preset-pastel-pie', name: 'Pastel Pie', description: 'Soft pastel pie with bottom legend', chartType: 'pie',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#93c5fd','#c4b5fd','#fca5a1','#a7f3d0','#fde68a','#fbcfe8','#99f6e4','#fed7aa'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#fefce8', opacity: 100 }, titleColor: '#44403c', subtitleColor: '#78716c', legendPosition: 'bottom', legendColor: '#57534e', datalabelsColor: '#44403c', datalabelsFontSize: 12 }),
    datasetStyle: { borderWidth: 3, tension: 0, fill: false, pointRadius: 0, borderRadius: 0, hoverOffset: 10 }, dimensions: { width: '700px', height: '700px' }, category: 'pastel', tags: ['pie','pastel','soft'], isOfficial: true, sortOrder: 30 },

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

  { id: 'preset-frost-radar', name: 'Frost Radar', description: 'Icy blue radar with translucent fill on white', chartType: 'radar',
    colorStrategy: { mode: 'single', singleColor: '#0ea5e9', baseColors: ['#0ea5e9','#38bdf8','#7dd3fc'], baseBorderColors: ['#0284c7'] },
    configSnapshot: buildConfig({ fillArea: true, titleColor: '#0c4a6e', subtitleColor: '#0369a1', legendColor: '#0369a1', legendPosition: 'top', datalabelsDisplay: false,
      scales: { r: { display: true, grid: { color: '#e0f2fe' }, angleLines: { color: '#bae6fd' }, pointLabels: { color: '#0369a1', font: { size: 12 } }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: true, pointRadius: 4, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'minimal', tags: ['radar','ice','blue','clean'], isOfficial: true, sortOrder: 48 },

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

  { id: 'preset-frost-polar', name: 'Frost Polar', description: 'Icy blues in a clean polar layout', chartType: 'polarArea',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#0284c7','#0369a1','#e0f2fe','#67e8f9'], baseBorderColors: ['#fff','#fff','#fff','#fff','#fff','#fff','#fff','#fff'] },
    configSnapshot: buildConfig({ titleColor: '#0c4a6e', subtitleColor: '#0369a1', legendPosition: 'top', legendColor: '#0369a1', datalabelsColor: '#0c4a6e', datalabelsFontSize: 11,
      scales: { r: { display: true, grid: { color: '#e0f2fe' }, ticks: { display: false } } } }),
    datasetStyle: { borderWidth: 2, tension: 0, fill: false, pointRadius: 0, borderRadius: 0 }, dimensions: { width: '700px', height: '700px' }, category: 'minimal', tags: ['polar','ice','blue','clean'], isOfficial: true, sortOrder: 57 },

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

  { id: 'preset-neon-horizontal', name: 'Neon Horizontal', description: 'Vivid neon horizontal bars on dark background', chartType: 'horizontalBar',
    colorStrategy: { mode: 'slice', singleColor: null, baseColors: ['#00f5d4','#7b2ff7','#f72585','#fee440','#00bbf9','#fb5607','#8338ec','#ff006e'], baseBorderColors: [] },
    configSnapshot: buildConfig({ background: { type: 'color', color: '#0f172a', opacity: 100 },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, border: { display: false } }, y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' }, border: { display: false } } },
      titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.5)', legendDisplay: false, datalabelsColor: '#ffffff' }),
    datasetStyle: { borderWidth: 0, tension: 0, fill: false, pointRadius: 0, borderRadius: 4 }, dimensions: { width: '800px', height: '500px' }, category: 'dark', tags: ['horizontal','neon','dark','vivid'], isOfficial: true, sortOrder: 66 },

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

];

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
