import type { Plugin, Chart } from 'chart.js';

/**
 * PatternConfig — stored on each dataset to describe what pattern to draw.
 *   slicePatterns: (PatternConfig | null)[]   — per-slice (bar index, arc index)
 *   datasetPattern: PatternConfig | null      — whole-dataset (area / radar fills, or grouped-mode bars)
 */
export interface PatternConfig {
  type: string;      // one of PATTERN_TYPES keys
  color: string;     // line / dot color
  lineWidth: number; // stroke width
  spacing: number;   // tile repeat size
  opacity?: number;  // 0-100 opacity percentage (default 100)
}

export const PATTERN_TYPES = {
  verticalLines:      'Vertical Lines',
  horizontalLines:    'Horizontal Lines',
  diagonalRight:      'Diagonal Lines (/)',
  diagonalLeft:       'Diagonal Lines (\\)',
  crosshatch:         'Crosshatch (+)',
  diagonalCrosshatch: 'Diagonal Crosshatch (X)',
  dots:               'Dots',
  dashes:             'Dashes',
  zigzag:             'Zigzag',
  checkerboard:       'Checkerboard',
} as const;

// ── Pattern tile renderers ──────────────────────────────────────────────────

type TileRenderer = (ctx: CanvasRenderingContext2D, size: number, color: string, lineWidth: number) => void;

const renderers: Record<string, TileRenderer> = {
  verticalLines(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
  },

  horizontalLines(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  },

  diagonalRight(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    // main diagonal
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    // overflow copies for seamless tiling
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, size * 2);
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 2, size);
    ctx.stroke();
  },

  diagonalLeft(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.moveTo(size * 2, 0);
    ctx.lineTo(0, size * 2);
    ctx.moveTo(size, -size);
    ctx.lineTo(-size, size);
    ctx.stroke();
  },

  crosshatch(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    // vertical
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    // horizontal
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  },

  diagonalCrosshatch(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
  },

  dots(ctx, size, color, lw) {
    ctx.fillStyle = color;
    const radius = Math.max(lw, 1.5);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fill();
  },

  dashes(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    const dashLen = size * 0.45;
    ctx.beginPath();
    ctx.moveTo((size - dashLen) / 2, size / 2);
    ctx.lineTo((size + dashLen) / 2, size / 2);
    ctx.stroke();
  },

  zigzag(ctx, size, color, lw) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.75);
    ctx.lineTo(size / 4, size * 0.25);
    ctx.lineTo(size / 2, size * 0.75);
    ctx.lineTo(size * 0.75, size * 0.25);
    ctx.lineTo(size, size * 0.75);
    ctx.stroke();
  },

  checkerboard(ctx, size, color, _lw) {
    ctx.fillStyle = color;
    const half = size / 2;
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);
  },
};

// ── Pattern cache ───────────────────────────────────────────────────────────

const patternCache = new Map<string, CanvasPattern>();

function getOrCreatePattern(
  chartCtx: CanvasRenderingContext2D,
  type: string,
  color: string,
  lineWidth: number,
  spacing: number
): CanvasPattern | null {
  const key = `${type}_${color}_${lineWidth}_${spacing}`;
  if (patternCache.has(key)) return patternCache.get(key)!;

  const render = renderers[type];
  if (!render) return null;

  const tile = document.createElement('canvas');
  tile.width = spacing;
  tile.height = spacing;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return null;

  render(tileCtx, spacing, color, lineWidth);

  const pattern = chartCtx.createPattern(tile, 'repeat');
  if (!pattern) return null;

  patternCache.set(key, pattern);
  // Simple cache management
  if (patternCache.size > 200) patternCache.clear();

  return pattern;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getPatternForSlice(dataset: any, sliceIndex: number): PatternConfig | null {
  // datasetPattern applies to ALL slices in the dataset (grouped mode / area / radar)
  if (dataset.datasetPattern && dataset.datasetPattern.type) {
    return dataset.datasetPattern;
  }
  // slicePatterns is per-slice (single mode for bar/pie/polar)
  if (dataset.slicePatterns && dataset.slicePatterns[sliceIndex]) {
    const p = dataset.slicePatterns[sliceIndex];
    if (p && p.type) return p;
  }
  return null;
}

// ── Plugin ──────────────────────────────────────────────────────────────────

export const slicePatternPlugin: Plugin = {
  id: 'slicePattern',

  afterDatasetDraw(chart: Chart, args: any) {
    const ctx = chart.ctx;
    const datasetIndex = args.index;
    const dataset = chart.data.datasets[datasetIndex] as any;
    if (!dataset) return;

    const meta = chart.getDatasetMeta(datasetIndex);
    if (meta.hidden) return;

    const metaType = meta.type;

      // ─── BAR charts ───────────────────────────────────────────────
      if (metaType === 'bar') {
        meta.data.forEach((element: any, elementIndex: number) => {
          const patternCfg = getPatternForSlice(dataset, elementIndex);
          if (!patternCfg) return;

          const pattern = getOrCreatePattern(
            ctx, patternCfg.type, patternCfg.color, patternCfg.lineWidth, patternCfg.spacing
          );
          if (!pattern) return;

          const props = element.getProps(['x', 'y', 'base', 'width', 'height', 'horizontal'], true);
          const { x, y, base, width, height } = props;
          const isHorizontal = props.horizontal !== undefined ? props.horizontal : (chart.options as any).indexAxis === 'y';

          if (x === undefined || y === undefined) return;

          ctx.save();
          // Apply opacity
          const opacity = (patternCfg as any).opacity != null ? (patternCfg as any).opacity / 100 : 1;
          ctx.globalAlpha = opacity;
          ctx.beginPath();

          // Retrieve border radius
          const br = element.options?.borderRadius;
          let rVal = 0;
          if (typeof br === 'number') rVal = br;
          else if (br && typeof br === 'object') rVal = Math.max(br.topLeft || 0, br.topRight || 0, br.bottomLeft || 0, br.bottomRight || 0) || 0;

          if (!isHorizontal) {
            const left = x - width / 2;
            const top = Math.min(y, base);
            const drawWidth = width;
            const drawHeight = Math.abs(base - y);
            const r = Math.min(drawWidth / 2, drawHeight / 2, rVal);

            if (r > 0.5 && ctx.roundRect) {
              const isPositive = y <= base;
              const radii = isPositive ? [r, r, 0, 0] : [0, 0, r, r];
              ctx.roundRect(left, top, drawWidth, drawHeight, radii);
            } else {
              ctx.rect(left, top, drawWidth, drawHeight);
            }
          } else {
            const left = Math.min(x, base);
            const top = y - height / 2;
            const drawWidth = Math.abs(x - base);
            const drawHeight = height;
            const r = Math.min(drawWidth / 2, drawHeight / 2, rVal);

            if (r > 0.5 && ctx.roundRect) {
              const isPositive = x >= base;
              const radii = isPositive ? [0, r, r, 0] : [r, 0, 0, r];
              ctx.roundRect(left, top, drawWidth, drawHeight, radii);
            } else {
              ctx.rect(left, top, drawWidth, drawHeight);
            }
          }

          ctx.clip();
          ctx.fillStyle = pattern;
          // Fill a large area — the clip constrains it
          const chartArea = chart.chartArea;
          ctx.fillRect(chartArea.left - 10, chartArea.top - 10,
            chartArea.right - chartArea.left + 20, chartArea.bottom - chartArea.top + 20);
          ctx.restore();
        });
      }

      // ─── PIE / DOUGHNUT / POLARAREA ───────────────────────────────
      else if (metaType === 'pie' || metaType === 'doughnut' || metaType === 'polarArea') {
        meta.data.forEach((element: any, elementIndex: number) => {
          const patternCfg = getPatternForSlice(dataset, elementIndex);
          if (!patternCfg) return;

          const pattern = getOrCreatePattern(
            ctx, patternCfg.type, patternCfg.color, patternCfg.lineWidth, patternCfg.spacing
          );
          if (!pattern) return;

          const props = element.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'], true);
          const { x, y, startAngle, endAngle, innerRadius, outerRadius } = props;

          if (startAngle === undefined || endAngle === undefined) return;

          ctx.save();
          // Apply opacity
          const opacity = (patternCfg as any).opacity != null ? (patternCfg as any).opacity / 100 : 1;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(x, y, outerRadius, startAngle, endAngle);
          if (innerRadius > 0) {
            ctx.arc(x, y, innerRadius, endAngle, startAngle, true);
          } else {
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.clip();

          ctx.fillStyle = pattern;
          ctx.fillRect(x - outerRadius - 5, y - outerRadius - 5,
            outerRadius * 2 + 10, outerRadius * 2 + 10);
          ctx.restore();
        });
      }

      // ─── LINE (area fill) / RADAR ─────────────────────────────────
      else if (metaType === 'line' || metaType === 'radar') {
        // Only apply datasetPattern (not per-slice) for line/area/radar
        const patternCfg = dataset.datasetPattern;
        if (!patternCfg || !patternCfg.type) return;

        // Skip drawing fill patterns for line charts that aren't filled (Area charts)
        if (metaType === 'line' && !dataset.fill) return;

        const pattern = getOrCreatePattern(
          ctx, patternCfg.type, patternCfg.color, patternCfg.lineWidth, patternCfg.spacing
        );
        if (!pattern) return;

        // We need to reconstruct the fill path. Chart.js doesn't expose the path directly,
        // so we build it from the data points.
        const points = meta.data;
        if (points.length < 2) return;

        ctx.save();
        // Apply opacity
        const opacity = (patternCfg as any).opacity != null ? (patternCfg as any).opacity / 100 : 1;
        ctx.globalAlpha = opacity;
        ctx.beginPath();

        if (metaType === 'radar') {
          // Radar: points form a closed polygon
          const firstPt = points[0].getProps(['x', 'y'], true);
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < points.length; i++) {
            const pt = points[i].getProps(['x', 'y'], true);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
        } else {
          // Area chart: fill between line and baseline
          // Get the fill target (baseline y)
          const chartArea = chart.chartArea;
          const scale = chart.scales['y'] || chart.scales['x'];
          const baselineY = scale ? scale.getPixelForValue(scale.min ?? 0) : chartArea.bottom;

          const firstPt = points[0].getProps(['x', 'y'], true);
          ctx.moveTo(firstPt.x, firstPt.y);

          for (let i = 1; i < points.length; i++) {
            const current = points[i].getProps(['x', 'y', 'cp1x', 'cp1y'], true);
            const previous = points[i - 1].getProps(['x', 'y', 'cp2x', 'cp2y'], true);
            if (previous.cp2x !== undefined && current.cp1x !== undefined) {
               ctx.bezierCurveTo(previous.cp2x, previous.cp2y, current.cp1x, current.cp1y, current.x, current.y);
            } else {
               ctx.lineTo(current.x, current.y);
            }
          }

          // Close along baseline
          const lastPt = points[points.length - 1].getProps(['x', 'y'], true);
          ctx.lineTo(lastPt.x, baselineY);
          ctx.lineTo(firstPt.x, baselineY);
          ctx.closePath();
        }

        ctx.clip();
        ctx.fillStyle = pattern;
        const chartArea = chart.chartArea;
        ctx.fillRect(chartArea.left - 10, chartArea.top - 10,
          chartArea.right - chartArea.left + 20, chartArea.bottom - chartArea.top + 20);
        ctx.restore();
      }
  },
};
