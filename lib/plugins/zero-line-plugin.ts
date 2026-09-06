import { Plugin } from 'chart.js';

/**
 * Zero Line Highlight Plugin
 * 
 * Draws a single bold line at value 0 on the value axis when enabled.
 * This is completely independent of grid.color / grid.lineWidth so it:
 *   - Has zero impact when disabled (grid lines remain untouched)
 *   - Only draws ONE line at the exact pixel position of value 0
 *   - Is drawn on top so it's always visible
 * 
 * Enable via chart options:
 *   options.plugins.zeroLineHighlight = {
 *     enabled: true,
 *     color: '#1e293b',    // optional, default dark slate
 *     lineWidth: 2.5,      // optional
 *     axis: 'y'            // 'y' for vertical charts, 'x' for horizontal
 *   }
 */
export const zeroLineHighlightPlugin: Plugin = {
  id: 'zeroLineHighlight',

  beforeDatasetsDraw(chart: any) {
    const opts = chart.config?.options?.plugins?.zeroLineHighlight;
    if (!opts || opts.enabled !== true) return;

    const axisKey = opts.axis || 'y';
    const scale = chart.scales?.[axisKey];
    if (!scale) return;

    // Only draw for scales that actually have a numeric 0 in range
    // (skip category scales, or scales where 0 is outside min/max)
    if (scale.type === 'category') return;
    if (scale.min > 0 || scale.max < 0) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    // Get pixel position of value 0
    const zeroPixel = scale.getPixelForValue(0);

    // Safety: make sure pixel is within chart area
    if (axisKey === 'y') {
      if (zeroPixel < chartArea.top - 1 || zeroPixel > chartArea.bottom + 1) return;
    } else {
      if (zeroPixel < chartArea.left - 1 || zeroPixel > chartArea.right + 1) return;
    }

    const color = opts.color || '#1e293b';
    const lineWidth = opts.lineWidth ?? 2.5;

    ctx.save();
    ctx.beginPath();

    if (axisKey === 'y') {
      // Horizontal line across chart at y=0
      ctx.moveTo(chartArea.left, zeroPixel);
      ctx.lineTo(chartArea.right, zeroPixel);
    } else {
      // Vertical line across chart at x=0
      ctx.moveTo(zeroPixel, chartArea.top);
      ctx.lineTo(zeroPixel, chartArea.bottom);
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  },
};
