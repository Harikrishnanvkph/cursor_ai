/**
 * Single source of truth for all supported chart types.
 * Import from here instead of duplicating the list across components.
 */

export interface ChartTypeOption {
  value: string
  label: string
}

/** Standard (2D) chart types */
export const STANDARD_CHART_TYPES: ChartTypeOption[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'horizontalBar', label: 'Horizontal Bar' },
  { value: 'stackedBar', label: 'Stacked Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'radar', label: 'Radar' },
  { value: 'polarArea', label: 'Polar Area' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'bubble', label: 'Bubble' },
]

/** 3D chart types */
export const THREE_D_CHART_TYPES: ChartTypeOption[] = [
  { value: 'pie3d', label: '3D Pie' },
  { value: 'doughnut3d', label: '3D Doughnut' },
  { value: 'bar3d', label: '3D Bar' },
  { value: 'horizontalBar3d', label: '3D Horizontal Bar' },
]

/** All chart types combined (standard + 3D) */
export const ALL_CHART_TYPES: ChartTypeOption[] = [
  ...STANDARD_CHART_TYPES,
  ...THREE_D_CHART_TYPES,
]
