/**
 * Single source of truth for all supported chart types.
 * Import from here instead of duplicating the list across components.
 */

export interface ChartTypeOption {
  value: string
  label: string
}

export interface ChartCategory {
  id: string
  label: string
  charts: ChartTypeOption[]
}

/** Categorized chart types: Categorical, Coordination, 3D, and More */
export const CATEGORIZED_CHART_TYPES: ChartCategory[] = [
  {
    id: 'categorical',
    label: 'Categorical',
    charts: [
      { value: 'bar', label: 'Bar' },
      { value: 'horizontalBar', label: 'Horizontal Bar' },
      { value: 'stackedBar', label: 'Stacked Bar' },
      { value: 'line', label: 'Line' },
      { value: 'area', label: 'Area' },
      { value: 'pie', label: 'Pie' },
      { value: 'doughnut', label: 'Doughnut' },
      { value: 'radar', label: 'Radar' },
      { value: 'polarArea', label: 'Polar Area' },
    ],
  },
  {
    id: 'coordination',
    label: 'Coordination',
    charts: [
      { value: 'scatter', label: 'Scatter' },
      { value: 'bubble', label: 'Bubble' },
    ],
  },
  {
    id: '3d',
    label: '3D',
    charts: [
      { value: 'bar3d', label: '3D Bar' },
      { value: 'horizontalBar3d', label: '3D Horizontal Bar' },
      { value: 'pie3d', label: '3D Pie' },
      { value: 'doughnut3d', label: '3D Doughnut' },
    ],
  },
  {
    id: 'more',
    label: 'More',
    charts: [
      { value: 'gauge', label: 'Gauge' },
      { value: 'funnel', label: 'Funnel' },
      { value: 'waterfall', label: 'Waterfall' },
      { value: 'timeline', label: 'Timeline Series' },
    ],
  },
]

/** Standard (2D) chart types */
export const STANDARD_CHART_TYPES: ChartTypeOption[] = [
  ...CATEGORIZED_CHART_TYPES.find(c => c.id === 'categorical')!.charts,
  ...CATEGORIZED_CHART_TYPES.find(c => c.id === 'coordination')!.charts,
  ...CATEGORIZED_CHART_TYPES.find(c => c.id === 'more')!.charts,
]

/** 3D chart types */
export const THREE_D_CHART_TYPES: ChartTypeOption[] = [
  ...CATEGORIZED_CHART_TYPES.find(c => c.id === '3d')!.charts,
]

/** All chart types combined (standard + 3D) */
export const ALL_CHART_TYPES: ChartTypeOption[] = [
  ...STANDARD_CHART_TYPES,
  ...THREE_D_CHART_TYPES,
]

export function getChartLabel(value: string): string {
  const found = ALL_CHART_TYPES.find(c => c.value === value)
  return found ? found.label : value
}

/** List of coordinate chart types that require (X, Y) pair data */
export const COORDINATE_CHART_TYPES = ['scatter', 'bubble'] as const

/** Checks if a chart type is a coordinate chart (Scatter or Bubble) */
export function isCoordinateChart(type: string): boolean {
  return (COORDINATE_CHART_TYPES as readonly string[]).includes(type)
}

/** Checks if a chart type is a categorical chart (requires labels and 1D data) */
export function isCategoricalChart(type: string): boolean {
  return !isCoordinateChart(type)
}

/**
 * Checks whether a chart category is compatible with the currently active chart type.
 * Categorical charts cannot transition to Coordinate charts and vice versa.
 */
export function isCategoryCompatible(categoryId: string, currentChartType: string): boolean {
  const currentIsCoord = isCoordinateChart(currentChartType)
  if (currentIsCoord) {
    return categoryId === 'coordination'
  } else {
    return categoryId !== 'coordination'
  }
}

/**
 * Checks whether a target chart type is compatible with the currently active chart type.
 */
export function isChartTypeCompatible(targetType: string, currentChartType: string): boolean {
  const currentIsCoord = isCoordinateChart(currentChartType)
  const targetIsCoord = isCoordinateChart(targetType)
  return currentIsCoord === targetIsCoord
}

/**
 * Explanatory message when a chart type or category is disabled due to schema incompatibility.
 */
export function getChartIncompatibilityReason(targetTypeOrCategory: string, currentChartType: string): string {
  const currentIsCoord = isCoordinateChart(currentChartType)
  if (currentIsCoord) {
    return 'Categorical charts require category labels and 1D data values. To use categorical charts, create a new chart or add a Categorical dataset.'
  } else {
    return 'Coordinate charts (Scatter & Bubble) require numeric (X, Y) coordinates instead of category labels. To use Scatter or Bubble, create a new chart or add a Coordinate dataset.'
  }
}
