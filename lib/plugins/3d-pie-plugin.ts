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
    
    // Simple cache management - clear if it grows too large
    if (colorCache.size > 500) colorCache.clear();
    
    return result;
  } catch (e) {
    return colorStr;
  }
}

export const pie3dPlugin: Plugin = {
  id: 'pie3d',
  defaults: {
    enabled: false,
    depth: 20,
    darken: 0.25,
    tilt: 0.75,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowOffsetY: 5
  },

  /**
   * Apply the tilt transform BEFORE datasets are drawn.
   * This transform persists through Chart.js's own dataset drawing,
   * so both our extruded walls AND the normal top-face pie are tilted.
   */
  beforeDatasetsDraw(chart: any, args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;

    const ctx = chart.ctx;
    const depth = typeof pluginOptions.depth === 'number' ? pluginOptions.depth : 20;
    const darkenPercent = typeof pluginOptions.darken === 'number' ? pluginOptions.darken : 0.25;
    const tilt = typeof pluginOptions.tilt === 'number' ? pluginOptions.tilt : 0.75;
    const shadowColor = pluginOptions.shadowColor || 'rgba(0,0,0,0.3)';
    const shadowBlur = typeof pluginOptions.shadowBlur === 'number' ? pluginOptions.shadowBlur : 10;
    const shadowOffsetX = typeof pluginOptions.shadowOffsetX === 'number' ? pluginOptions.shadowOffsetX : 0;
    const shadowOffsetY = typeof pluginOptions.shadowOffsetY === 'number' ? pluginOptions.shadowOffsetY : 5;

    const datasetsMeta = chart.data.datasets.map((_: any, i: number) => chart.getDatasetMeta(i));
    
    const hasArcs = datasetsMeta.some((meta: any) => meta.type === 'pie' || meta.type === 'doughnut');
    if (!hasArcs) return;

    const chartArea = chart.chartArea;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    // --- Phase 1: Draw drop shadow beneath the 3D shape ---
    if (shadowBlur > 0 || shadowOffsetY > 0) {
      ctx.save();
      
      // We use an off-screen translation trick to draw ONLY the shadow.
      // If we draw with 0.01 opacity (as before), the shadow itself is also 0.01 opacity.
      // By drawing far off-screen with 1.0 opacity and pulling the shadow back, 
      // we get a full-strength shadow without seeing the source object.
      const BIG_OFFSET = 10000;
      
      // 1. Move the context far to the right
      ctx.translate(BIG_OFFSET, 0);

      // 2. Apply the same tilt and placement as the actual pie
      ctx.translate(centerX, centerY);
      ctx.scale(1, tilt);
      ctx.translate(-centerX, -centerY);
      
      // 3. Position the shadow source
      ctx.translate(shadowOffsetX, depth + shadowOffsetY);
      
      // 4. Set shadow properties, but pull the shadow back BIG_OFFSET to the left
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = -BIG_OFFSET;
      ctx.shadowOffsetY = 0;

      // Draw a filled shape using the arc elements as a base for the shadow
      datasetsMeta.forEach((meta: any) => {
        if (!meta.hidden && (meta.type === 'pie' || meta.type === 'doughnut')) {
          meta.data.forEach((element: any) => {
            const origBg = element.options.backgroundColor;
            const origBorder = element.options.borderWidth;
            // Use solid color to ensure shadow is cast at full strength
            element.options.backgroundColor = 'rgba(0,0,0,1)'; 
            element.options.borderWidth = 0;
            element.draw(ctx);
            element.options.backgroundColor = origBg;
            element.options.borderWidth = origBorder;
          });
        }
      });

      ctx.restore();
    }

    // --- Phase 2: Draw 3D extrusion walls ---
    const originalColors: any[] = [];
    const originalBorders: any[] = [];

    datasetsMeta.forEach((meta: any, datasetIndex: number) => {
      originalColors[datasetIndex] = [];
      originalBorders[datasetIndex] = [];
      
      meta.data.forEach((element: any, index: number) => {
        originalColors[datasetIndex][index] = element.options.backgroundColor;
        originalBorders[datasetIndex][index] = element.options.borderWidth;
        element.options.backgroundColor = darkenColor(element.options.backgroundColor, darkenPercent);
        element.options.borderWidth = 0;
      });
    });

    // Save the context, apply tilt, and draw extruded walls
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Apply tilt for walls
    ctx.translate(centerX, centerY);
    ctx.scale(1, tilt);
    ctx.translate(-centerX, -centerY);

    for (let d = depth; d > 0; d--) {
      ctx.save();
      ctx.translate(0, d);
      
      datasetsMeta.forEach((meta: any) => {
        if (!meta.hidden && (meta.type === 'pie' || meta.type === 'doughnut')) {
          meta.data.forEach((element: any) => {
            element.draw(ctx);
          });
        }
      });
      
      ctx.restore();
    }
    
    ctx.restore(); // Restore walls tilt context

    // Restore original colors for the top face
    datasetsMeta.forEach((meta: any, datasetIndex: number) => {
      meta.data.forEach((element: any, index: number) => {
        element.options.backgroundColor = originalColors[datasetIndex][index];
        element.options.borderWidth = originalBorders[datasetIndex][index];
      });
    });

    // --- Phase 3: Apply tilt transform that persists for Chart.js's dataset drawing ---
    // This ctx.save() will be restored in afterDatasetsDraw
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1, tilt);
    ctx.translate(-centerX, -centerY);

    // Store reference so afterDatasetsDraw knows to restore
    (chart as any)._pie3d_tiltApplied = true;
  },

  /**
   * Restore the tilt transform after Chart.js finishes drawing datasets.
   */
  afterDatasetsDraw(chart: any, args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;
    
    if ((chart as any)._pie3d_tiltApplied) {
      chart.ctx.restore();
      delete (chart as any)._pie3d_tiltApplied;
    }
  }
};
