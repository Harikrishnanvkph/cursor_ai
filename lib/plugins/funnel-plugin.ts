import type { Plugin } from 'chart.js';

/**
 * Funnel Plugin — Transforms a horizontal bar chart into a centered funnel.
 *
 * The base chart is a bar with indexAxis: 'y' (horizontal bars).
 * This plugin:
 *   1. beforeDatasetsDraw: Overrides bar positions to center-align them and
 *      progressively narrow each bar based on its value relative to the max.
 *   2. afterDatasetsDraw: Draws trapezoid connectors between consecutive bars.
 *
 * Plugin config is read from chart.options.plugins.funnel
 */

export interface FunnelPluginOptions {
  enabled: boolean
  showConnectors: boolean
  connectorColor: string
  connectorOpacity: number
  centered: boolean
  coneShape: 'box' | 'sharp'
}

export const funnelPlugin: Plugin = {
  id: 'funnel',
  defaults: {
    enabled: false,
    showConnectors: true,
    connectorColor: 'rgba(0,0,0,0.08)',
    connectorOpacity: 0.15,
    centered: true,
    coneShape: 'box',
  },

  beforeDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;
    if (!pluginOptions.centered) return;

    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length === 0) return;

    const dataset = chart.data.datasets[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) return;

    const chartArea = chart.chartArea;
    const chartCenterX = (chartArea.left + chartArea.right) / 2;
    const maxBarWidth = chartArea.right - chartArea.left;

    // Find the maximum data value for proportional scaling
    const maxValue = Math.max(...dataset.data.map((v: any) =>
      typeof v === 'number' ? Math.abs(v) : 0
    ));
    if (maxValue === 0) return;

    // Store original positions for connector drawing
    const barPositions: { x: number; width: number; y: number; height: number; color: string }[] = [];

    meta.data.forEach((bar: any, index: number) => {
      const value = typeof dataset.data[index] === 'number' ? Math.abs(dataset.data[index]) : 0;
      const ratio = value / maxValue;
      const barWidth = maxBarWidth * ratio;

      // Center the bar horizontally
      const newX = chartCenterX - barWidth / 2;

      // Resolve color for drawing sharp cones later
      // We must avoid reading 'transparent' if we mutated it previously
      if (bar.options && bar.options.backgroundColor && bar.options.backgroundColor !== 'transparent') {
        bar._funnelOriginalColor = bar.options.backgroundColor;
      }
      
      let color = bar._funnelOriginalColor;
      if (!color) {
        const dsColor = dataset.backgroundColor;
        if (Array.isArray(dsColor)) {
          color = dsColor[index] || dsColor[0] || 'rgba(0,0,0,0.1)';
        } else if (dsColor) {
          color = dsColor;
        } else {
          color = 'rgba(0,0,0,0.1)';
        }
      }

      // Store for connector drawing
      barPositions.push({
        x: newX,
        width: barWidth,
        y: bar.y - bar.height / 2,
        height: bar.height,
        color: color,
      });

      // ALWAYS mutate bar layout so tooltips and labels align to the centered bar
      bar.x = chartCenterX + barWidth / 2; // right edge
      bar.base = chartCenterX - barWidth / 2; // left edge
      bar.width = barWidth;

      if (pluginOptions.coneShape === 'sharp') {
        // Hide the default bar so we can draw our own trapezoid in afterDatasetsDraw
        bar.options.backgroundColor = 'transparent';
        bar.options.borderColor = 'transparent';
      }
    });

    // Store positions on the chart instance for afterDatasetsDraw
    (chart as any)._funnelBarPositions = barPositions;
  },

  afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    if (!pluginOptions || !pluginOptions.enabled) return;

    const positions = (chart as any)._funnelBarPositions;
    if (!positions || positions.length === 0) return;

    const ctx = chart.ctx;
    const connectorColor = pluginOptions.connectorColor || 'rgba(0,0,0,0.08)';
    const isSharp = pluginOptions.coneShape === 'sharp';

    ctx.save();

    if (isSharp) {
      // Draw sharp cones (trapezoidal bars)
      for (let i = 0; i < positions.length; i++) {
        const current = positions[i];
        // The bottom width is either the next bar's width, or if it's the last bar, 
        // we can taper it to 0 or keep it the same. Tapering to 0 makes a sharp point.
        // Or better, we taper it based on the distance. Let's make it taper to a smaller ratio
        // or just use the current width if we don't want a point. A typical sharp funnel 
        // tapers down. Let's taper to the next bar's width.
        const nextWidth = i < positions.length - 1 ? positions[i + 1].width : current.width * 0.5;

        // Calculate bottom coordinates centered
        const chartArea = chart.chartArea;
        const chartCenterX = (chartArea.left + chartArea.right) / 2;
        const nextLeft = chartCenterX - nextWidth / 2;
        const nextRight = chartCenterX + nextWidth / 2;

        const topY = current.y;
        const bottomY = current.y + current.height;
        const topLeft = current.x;
        const topRight = current.x + current.width;

        ctx.beginPath();
        ctx.moveTo(topLeft, topY);
        ctx.lineTo(topRight, topY);
        ctx.lineTo(nextRight, bottomY);
        ctx.lineTo(nextLeft, bottomY);
        ctx.closePath();
        ctx.fillStyle = current.color;
        ctx.fill();
      }
    } else if (pluginOptions.showConnectors && positions.length > 1) {
      // Draw trapezoid connectors between consecutive bars for box shape
      for (let i = 0; i < positions.length - 1; i++) {
        const upper = positions[i];
        const lower = positions[i + 1];

        // Upper bar: bottom edge
        const upperBottomY = upper.y + upper.height;
        const upperLeft = upper.x;
        const upperRight = upper.x + upper.width;

        // Lower bar: top edge
        const lowerTopY = lower.y;
        const lowerLeft = lower.x;
        const lowerRight = lower.x + lower.width;

        // Draw trapezoid
        ctx.beginPath();
        ctx.moveTo(upperLeft, upperBottomY);
        ctx.lineTo(upperRight, upperBottomY);
        ctx.lineTo(lowerRight, lowerTopY);
        ctx.lineTo(lowerLeft, lowerTopY);
        ctx.closePath();
        ctx.fillStyle = connectorColor;
        ctx.fill();
      }
    }

    ctx.restore();

    // Clean up stored positions
    delete (chart as any)._funnelBarPositions;
  }
};
