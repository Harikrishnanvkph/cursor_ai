import { Plugin } from 'chart.js';

export interface TimelineCrosshairOptions {
  enabled?: boolean;
  lineColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  showIntersectionPoint?: boolean;
  pointColor?: string;
  pointRadius?: number;
  showHorizontalLine?: boolean;
}

export const timelineCrosshairPlugin: Plugin = {
  id: 'timelineCrosshair',

  afterEvent(chart: any, args: any) {
    const opts = chart.config?.options?.plugins?.timelineCrosshair;
    if (!opts || opts.enabled === false) return;

    if (args.event.type === 'mousemove' && args.inChartArea) {
      // Throttle redraws: only flag args.changed if the hovered data element/index actually changed.
      // This prevents 60-120 full canvas wipes per second during cursor hover within the same point interval.
      const active = chart.tooltip?._active?.[0] || chart.getActiveElements?.()?.[0];
      const currentIndex = active ? active.index : -1;
      const prevIndex = chart._prevTimelineActiveIndex ?? -1;

      if (currentIndex !== prevIndex) {
        chart._prevTimelineActiveIndex = currentIndex;
        args.changed = true;
      }
    } else if (args.event.type === 'mouseout') {
      if (chart._prevTimelineActiveIndex !== -1) {
        chart._prevTimelineActiveIndex = -1;
        args.changed = true;
      }
    }
  },

  afterDraw(chart: any) {
    const opts: TimelineCrosshairOptions = chart.config?.options?.plugins?.timelineCrosshair;
    if (!opts || opts.enabled === false) return;

    // Check if chart has active hovered points
    const active = chart.tooltip?._active?.[0] || chart.getActiveElements?.()?.[0];
    if (!active || !active.element) return;

    const { x, y } = active.element;
    const { chartArea, ctx } = chart;
    if (!chartArea) return;

    // Boundary check
    if (x < chartArea.left - 2 || x > chartArea.right + 2) return;

    ctx.save();

    // 1. Draw Vertical Crosshair Hairline
    ctx.beginPath();
    ctx.setLineDash(opts.lineDash || [4, 4]);
    ctx.strokeStyle = opts.lineColor || '#94a3b8';
    ctx.lineWidth = opts.lineWidth ?? 1.5;
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();

    // 2. Optional Horizontal Crosshair Line
    if (opts.showHorizontalLine && y >= chartArea.top && y <= chartArea.bottom) {
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
    }

    // 3. Highlighted Intersection Point (Google Finance style glow ring)
    if (opts.showIntersectionPoint !== false && y >= chartArea.top && y <= chartArea.bottom) {
      const pointColor = opts.pointColor || '#2563eb';
      const radius = opts.pointRadius ?? 4;

      // Outer glow aura
      ctx.setLineDash([]);
      ctx.fillStyle = `${pointColor}33`; // 20% opacity
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Middle ring
      ctx.fillStyle = pointColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
};
