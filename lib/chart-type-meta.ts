/**
 * Metadata and color palette definitions for distinct chart types.
 * Every chart type receives a unique, vibrant color to avoid generic gray tones.
 */

export interface ChartTypeMeta {
  displayName: string
  dotColor: string
  badgeClass: string
}

const FALLBACK_PALETTES = [
  { dot: "bg-violet-600", badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60" },
  { dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60" },
  { dot: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" },
  { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
  { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" },
  { dot: "bg-indigo-600", badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60" },
  { dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60" },
  { dot: "bg-fuchsia-600", badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/60" },
]

export const CHART_TYPE_REGISTRY: Record<string, { name: string; dot: string; badge: string }> = {
  bar: {
    name: "Bar",
    dot: "bg-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
  },
  horizontalbar: {
    name: "Horizontal Bar",
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
  },
  line: {
    name: "Line",
    dot: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  area: {
    name: "Area",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
  },
  pie: {
    name: "Pie",
    dot: "bg-purple-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
  },
  doughnut: {
    name: "Doughnut",
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
  },
  radar: {
    name: "Radar",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  },
  polararea: {
    name: "Polar Area",
    dot: "bg-lime-600",
    badge: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800/60",
  },
  bubble: {
    name: "Bubble",
    dot: "bg-indigo-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
  },
  scatter: {
    name: "Scatter",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  },
  waterfall: {
    name: "Waterfall",
    dot: "bg-fuchsia-600",
    badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/60",
  },
  gauge: {
    name: "Gauge",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60",
  },
  bar3d: {
    name: "3D Bar",
    dot: "bg-cyan-600",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60",
  },
  pie3d: {
    name: "3D Pie",
    dot: "bg-violet-600",
    badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60",
  },
  doughnut3d: {
    name: "3D Doughnut",
    dot: "bg-amber-600",
    badge: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  },
  funnel: {
    name: "Funnel",
    dot: "bg-pink-500",
    badge: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60",
  },
  candlestick: {
    name: "Candlestick",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  treemap: {
    name: "Treemap",
    dot: "bg-green-700",
    badge: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/60",
  },
  heatmap: {
    name: "Heatmap",
    dot: "bg-orange-600",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
  },
}

function normalizeKey(type: string): string {
  return (type || "").toLowerCase().replace(/[-_ ]/g, "")
}

function getDeterministicFallback(type: string) {
  let hash = 0
  const str = type || "default"
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length
  return FALLBACK_PALETTES[index]
}

export function formatChartTypeName(type: string): string {
  if (!type) return "Unknown"
  const key = normalizeKey(type)
  if (CHART_TYPE_REGISTRY[key]) {
    return CHART_TYPE_REGISTRY[key].name
  }
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function getChartTypeDotColor(type: string): string {
  const key = normalizeKey(type)
  if (CHART_TYPE_REGISTRY[key]) {
    return CHART_TYPE_REGISTRY[key].dot
  }
  return getDeterministicFallback(type).dot
}

export function getChartTypeBadgeClass(type: string): string {
  const key = normalizeKey(type)
  if (CHART_TYPE_REGISTRY[key]) {
    return CHART_TYPE_REGISTRY[key].badge
  }
  return getDeterministicFallback(type).badge
}
