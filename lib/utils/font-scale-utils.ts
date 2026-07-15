/**
 * font-scale-utils.ts
 *
 * Computes intelligently scaled font sizes for Chart.js based on:
 *   1. Canvas physical size (width × height) — bigger canvas → bigger fonts
 *   2. Number of data points / slices — more labels → smaller tick fonts
 *   3. Existing font sizes in the config — proportionally scaled, not replaced
 *
 * Strategy: PROPORTIONAL SCALING
 *   - Read existing size from config (or fall back to baseline for 800×600)
 *   - Scale it by: targetDiagonal / baseDiagonal
 *   - This preserves the user's relative intent while making text legible at any resolution
 *   - force=true is always used in the live renderer AND export pipeline
 *
 * Why force=true everywhere?
 *   Chart.js global defaults (Chart.defaults.font.size = 12) override config
 *   paths that don't have an explicit value. Without writing an explicit value,
 *   Chart.js ignores the config and uses its 12px global — making text tiny on
 *   large canvases. We always need to write an explicit size.
 */

// ─── Reference baseline ───────────────────────────────────────────────────────
// All baseline sizes are calibrated for an 800 × 600 canvas.

const BASE_WIDTH  = 800
const BASE_HEIGHT = 600

// Fallback sizes used when no explicit size is found in the config
// (i.e., the chart is using Chart.js global defaults)
const BASELINE = {
  title:      18,
  subtitle:   12,
  legend:     12,
  tickX:      11,
  tickY:      11,
  axisLabelX: 13,
  axisLabelY: 13,
  datalabel:  12,
  pointLabel: 12,
}

// Absolute min/max clamps regardless of scale factor
const CLAMP = {
  title:      [10, 64] as [number, number],
  subtitle:   [ 8, 40] as [number, number],
  legend:     [ 8, 32] as [number, number],
  tickX:      [ 7, 26] as [number, number],
  tickY:      [ 7, 26] as [number, number],
  axisLabelX: [ 8, 28] as [number, number],
  axisLabelY: [ 8, 28] as [number, number],
  datalabel:  [ 7, 32] as [number, number],
  pointLabel: [ 8, 28] as [number, number],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Canvas diagonal scale factor vs the 800×600 baseline.
 * 800×600  → 1.0   (no change)
 * 1280×720 → 1.44
 * 1920×1080 → 2.09
 * 2560×1440 → 2.74
 */
export function computeScaleFactor(width: number, height: number): number {
  const baseDiag   = Math.sqrt(BASE_WIDTH ** 2 + BASE_HEIGHT ** 2)
  const targetDiag = Math.sqrt(width      ** 2 + height     ** 2)
  return targetDiag / baseDiag
}

/**
 * Reduction factor for tick / point-label fonts when there are many data points.
 * ≤ 6 labels → 1.0 (full size)
 * 20+ labels → 0.65 (35 % smaller — avoids label collisions)
 * Linear interpolation in between.
 */
function dataCountTickFactor(dataCount: number): number {
  if (dataCount <= 6)  return 1.0
  if (dataCount >= 20) return 0.65
  return 1.0 - ((dataCount - 6) / 14) * 0.35
}

/**
 * Deep-read: safely get a nested value from an object, returning undefined if
 * any segment of the path is missing.
 */
function deepGet(obj: Record<string, any>, path: string[]): any {
  let cur = obj
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[key]
  }
  return cur
}

/**
 * Deep-write: set a nested value, creating intermediate objects as needed.
 */
function deepSet(obj: Record<string, any>, path: string[], value: any): void {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') {
      cur[path[i]] = {}
    }
    cur = cur[path[i]]
  }
  cur[path[path.length - 1]] = value
}

// ─── Main API ─────────────────────────────────────────────────────────────────

export interface FontScaleOptions {
  /** Canvas width in CSS pixels */
  width: number
  /** Canvas height in CSS pixels */
  height: number
  /** Number of labels / data points (for tick density reduction) */
  dataCount?: number
  /** Chart type — reserved for future type-specific tweaks */
  chartType?: string
}

/**
 * Apply intelligently-scaled font sizes to a Chart.js config clone.
 *
 * STRATEGY:
 *   For each font path, read the existing value from `config`.
 *   If an explicit size exists → scale it proportionally.
 *   If no explicit size exists → use baseline × scaleFactor.
 *   Either way, always write the result — never leave Chart.js to fall back
 *   to its 12px global default on large canvases.
 *
 * @param config    Original Chart.js options object (not mutated)
 * @param options   Canvas dimensions + data count
 * @returns         Deep-cloned config with corrected font sizes
 */
export function applyFontScaling(
  config: Record<string, any>,
  options: FontScaleOptions
): Record<string, any> {
  const { width, height, dataCount = 8 } = options

  const scaleFactor  = computeScaleFactor(width, height)
  const tickFactor   = dataCountTickFactor(dataCount)

  // Deep clone — never mutate the store's config object
  const cfg: Record<string, any> = JSON.parse(JSON.stringify(config))

  /**
   * Scale a single font-size path.
   * @param path        Dot-path into cfg (e.g. ['plugins','title','font','size'])
   * @param baseline    Fallback size if no explicit value in config (px at 800×600)
   * @param extraFactor Optional additional multiplier (e.g. tickFactor)
   * @param clampRange  [min, max] clamp bounds
   */
  const scaleAt = (
    path: string[],
    baseline: number,
    extraFactor: number,
    clampRange: [number, number]
  ) => {
    const existing = deepGet(cfg, path)
    // Use existing explicit size if set; otherwise fall back to baseline
    const base = (typeof existing === 'number' && existing > 0) ? existing : baseline
    const scaled = Math.round(base * scaleFactor * extraFactor)
    deepSet(cfg, path, clamp(scaled, clampRange[0], clampRange[1]))
  }

  const full = 1.0 // no extra reduction

  // ── Title & Subtitle ──
  scaleAt(['plugins', 'title',    'font', 'size'], BASELINE.title,    full,       CLAMP.title)
  scaleAt(['plugins', 'subtitle', 'font', 'size'], BASELINE.subtitle, full,       CLAMP.subtitle)

  // ── Legend ──
  scaleAt(['plugins', 'legend', 'labels', 'font', 'size'], BASELINE.legend, full, CLAMP.legend)

  // ── Cartesian axes (x / y) ──
  // Only write for Cartesian chart types
  const chartType = options.chartType || 'bar'
  const isCartesian = !['pie', 'doughnut', 'radar', 'polarArea', 'gauge', 'pie3d', 'doughnut3d'].includes(chartType)
  if (isCartesian) {
    scaleAt(['scales', 'x', 'ticks', 'font', 'size'],  BASELINE.tickX,      tickFactor, CLAMP.tickX)
    scaleAt(['scales', 'x', 'title', 'font', 'size'],  BASELINE.axisLabelX, full,       CLAMP.axisLabelX)
    scaleAt(['scales', 'y', 'ticks', 'font', 'size'],  BASELINE.tickY,      tickFactor, CLAMP.tickY)
    scaleAt(['scales', 'y', 'title', 'font', 'size'],  BASELINE.axisLabelY, full,       CLAMP.axisLabelY)
  }

  // ── Radial scale (radar / polarArea) ──
  // Only write for radial chart types
  const isRadial = ['radar', 'polarArea'].includes(chartType)
  if (isRadial) {
    scaleAt(['scales', 'r', 'pointLabels', 'font', 'size'], BASELINE.pointLabel, tickFactor, CLAMP.pointLabel)
    scaleAt(['scales', 'r', 'ticks',       'font', 'size'], BASELINE.tickY,      tickFactor, CLAMP.tickY)
  }

  // ── Datalabels plugin ──
  scaleAt(['plugins', 'datalabels', 'font', 'size'], BASELINE.datalabel, full, CLAMP.datalabel)

  return cfg
}

/**
 * Convenience wrapper for the export pipeline.
 * Identical to applyFontScaling but named clearly for the export context.
 */
export function buildExportConfig(
  config: Record<string, any>,
  exportW: number,
  exportH: number,
  dataCount: number,
  chartType: string
): Record<string, any> {
  return applyFontScaling(config, { width: exportW, height: exportH, dataCount, chartType })
}

// ─── Legacy shim ─────────────────────────────────────────────────────────────
// Keep old function names so existing callers don't break during migration.

/** @deprecated Use applyFontScaling() directly */
export function computeScaledFonts(input: FontScaleOptions) {
  const sf = computeScaleFactor(input.width, input.height)
  const tf = dataCountTickFactor(input.dataCount ?? 8)
  const s  = (base: number, ef = 1) => Math.round(base * sf * ef)
  return {
    title:      clamp(s(BASELINE.title),                CLAMP.title[0],      CLAMP.title[1]),
    subtitle:   clamp(s(BASELINE.subtitle),             CLAMP.subtitle[0],   CLAMP.subtitle[1]),
    legend:     clamp(s(BASELINE.legend),               CLAMP.legend[0],     CLAMP.legend[1]),
    tickX:      clamp(s(BASELINE.tickX,      tf),       CLAMP.tickX[0],      CLAMP.tickX[1]),
    tickY:      clamp(s(BASELINE.tickY,      tf),       CLAMP.tickY[0],      CLAMP.tickY[1]),
    axisLabelX: clamp(s(BASELINE.axisLabelX),           CLAMP.axisLabelX[0], CLAMP.axisLabelX[1]),
    axisLabelY: clamp(s(BASELINE.axisLabelY),           CLAMP.axisLabelY[0], CLAMP.axisLabelY[1]),
    datalabel:  clamp(s(BASELINE.datalabel),            CLAMP.datalabel[0],  CLAMP.datalabel[1]),
    pointLabel: clamp(s(BASELINE.pointLabel, tf),       CLAMP.pointLabel[0], CLAMP.pointLabel[1]),
  }
}

/** @deprecated Use applyFontScaling() directly */
export function applyScaledFontsToConfig(
  config: Record<string, any>,
  _fonts: any,
  _force = false
): Record<string, any> {
  // Ignore the pre-computed fonts object — re-derive from config dimensions
  // so proportional scaling of existing sizes works correctly
  const w = config?.width  ? parseInt(String(config.width),  10) : BASE_WIDTH
  const h = config?.height ? parseInt(String(config.height), 10) : BASE_HEIGHT
  return applyFontScaling(config, { width: isNaN(w) ? BASE_WIDTH : w, height: isNaN(h) ? BASE_HEIGHT : h })
}
