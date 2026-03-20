import type { Plugin } from 'chart.js';

// Reusable canvas for color processing to avoid memory pressure
let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;
const colorCache = new Map<string, string>();

/**
 * A utility to darken any valid CSS color string using a hidden canvas.
 * Optimized with caching and canvas reuse.
 */
function darkenColor(colorStr: string | unknown, percent: number): string {
  if (typeof colorStr !== 'string') return typeof colorStr === 'object' ? colorStr as any : '#111';
  if (typeof document === 'undefined') return colorStr;

  const cacheKey = `${colorStr}_${percent}`;
  if (colorCache.has(cacheKey)) return colorCache.get(cacheKey)!;

  try {
    if (!helperCanvas) {
      helperCanvas = document.createElement('canvas');
      helperCanvas.width = 1;
      helperCanvas.height = 1;
      helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
    }
    
    if (!helperCtx) return colorStr;
    
    helperCtx.clearRect(0, 0, 1, 1);
    helperCtx.fillStyle = colorStr;
    helperCtx.fillRect(0, 0, 1, 1);
    const data = helperCtx.getImageData(0, 0, 1, 1).data;
    
    const r = Math.max(0, Math.floor(data[0] * (1 - percent)));
    const g = Math.max(0, Math.floor(data[1] * (1 - percent)));
    const b = Math.max(0, Math.floor(data[2] * (1 - percent)));
    const a = data[3] / 255;
    
    const result = `rgba(${r}, ${g}, ${b}, ${a})`;
    colorCache.set(cacheKey, result);
    
    // Simple cache management
    if (colorCache.size > 500) colorCache.clear();
    
    return result;
  } catch (e) {
    return colorStr;
  }
}

export const bar3dPlugin: Plugin = {
  id: 'bar3d',
  defaults: {
    enabled: false,
    depth: 12,
    darken: 0.2,
    angle: 45 // Perspective angle in degrees
  },

  beforeDatasetsDraw(chart: any, args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;

    const ctx = chart.ctx;
    const depth = typeof pluginOptions.depth === 'number' ? pluginOptions.depth : 12;
    const darkenPercent = typeof pluginOptions.darken === 'number' ? pluginOptions.darken : 0.2;
    const angleRad = (typeof pluginOptions.angle === 'number' ? pluginOptions.angle : 45) * Math.PI / 180;

    // Calculate offset components
    const dx = Math.cos(angleRad) * depth;
    const dy = -Math.sin(angleRad) * depth; // Negative because Y is down in canvas

    const shadowColor = pluginOptions.shadowColor || 'rgba(0,0,0,0.3)';
    const shadowBlur = typeof pluginOptions.shadowBlur === 'number' ? pluginOptions.shadowBlur : 10;
    const shadowOffsetX = typeof pluginOptions.shadowOffsetX === 'number' ? pluginOptions.shadowOffsetX : 0;
    const shadowOffsetY = typeof pluginOptions.shadowOffsetY === 'number' ? pluginOptions.shadowOffsetY : 5;

    const isHorizontalChart = chart.options.indexAxis === 'y';

    // --- Phase 1: Draw drop shadows ---
    if (shadowBlur > 0 || shadowOffsetY > 0) {
      ctx.save();
      const BIG_OFFSET = 10000;
      ctx.translate(BIG_OFFSET, 0);

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = -BIG_OFFSET;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = 'rgba(0,0,0,1)'; // Solid color for shadow casting

      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden || meta.type !== 'bar') return;

        meta.data.forEach((element: any) => {
          const props = element.getProps(['x', 'y', 'base', 'width', 'height', 'horizontal'], true);
          const { x, y, base, width, height } = props;
          const horizontal = props.horizontal !== undefined ? props.horizontal : isHorizontalChart;

          if (x === undefined || y === undefined) return;

          ctx.save();
          // Position the shadow relative to the back of the 3D bar
          ctx.translate(dx + shadowOffsetX, dy + shadowOffsetY);

          if (!horizontal) {
            // Vertical Bar
            const left = x - width / 2;
            const top = y;
            const drawWidth = width;
            const drawHeight = base - y;
            ctx.fillRect(left, top, drawWidth, drawHeight);
          } else {
            // Horizontal Bar
            const left = base;
            const top = y - height / 2;
            const drawWidth = x - base;
            const drawHeight = height;
            ctx.fillRect(left, top, drawWidth, drawHeight);
          }
          ctx.restore();
        });
      });
      ctx.restore();
    }

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden || meta.type !== 'bar') return;

      meta.data.forEach((element: any) => {
        // Use getProps for safer access in Chart.js 3/4
        const props = element.getProps(['x', 'y', 'base', 'width', 'height', 'horizontal'], true);
        const { x, y, base, width, height } = props;
        const horizontal = props.horizontal !== undefined ? props.horizontal : isHorizontalChart;
        
        if (x === undefined || y === undefined) return;

        const color = element.options.backgroundColor;
        const sideColor = darkenColor(color, darkenPercent);
        const topColor = darkenColor(color, darkenPercent * 0.5);

        ctx.save();
        ctx.fillStyle = sideColor;

        if (!horizontal) {
          // Vertical Bar
          const left = x - width / 2;
          const right = x + width / 2;
          const top = y;
          const bottom = base;

          // Side face (pick left or right based on dx)
          const sideX = dx >= 0 ? right : left;
          ctx.beginPath();
          ctx.moveTo(sideX, top);
          ctx.lineTo(sideX + dx, top + dy);
          ctx.lineTo(sideX + dx, bottom + dy);
          ctx.lineTo(sideX, bottom);
          ctx.closePath();
          ctx.fill();

          // Top face (pick top or bottom based on dy)
          const topY = dy <= 0 ? top : bottom;
          ctx.fillStyle = topColor;
          ctx.beginPath();
          ctx.moveTo(left, topY);
          ctx.lineTo(left + dx, topY + dy);
          ctx.lineTo(right + dx, topY + dy);
          ctx.lineTo(right, topY);
          ctx.closePath();
          ctx.fill();
        } else {
          // Horizontal Bar
          const left = base;
          const right = x;
          const top = y - height / 2;
          const bottom = y + height / 2;

          // "Top" face (pick top or bottom edge based on dy)
          const edgeY = dy <= 0 ? top : bottom;
          ctx.beginPath();
          ctx.moveTo(left, edgeY);
          ctx.lineTo(left + dx, edgeY + dy);
          ctx.lineTo(right + dx, edgeY + dy);
          ctx.lineTo(right, edgeY);
          ctx.closePath();
          ctx.fill();

          // End face (pick left or right end based on dx)
          const endX = dx >= 0 ? right : left;
          ctx.fillStyle = topColor;
          ctx.beginPath();
          ctx.moveTo(endX, top);
          ctx.lineTo(endX + dx, top + dy);
          ctx.lineTo(endX + dx, bottom + dy);
          ctx.lineTo(endX, bottom);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });
    });
  }
};
