// Subtitle Plugin for Chart.js
// Renders subtitle below the title with customizable styling

import { Chart, Plugin } from 'chart.js';

export const subtitlePlugin: Plugin = {
  id: 'subtitle',

  beforeDraw: (chart: Chart, args: any, options: any) => {
    const subtitleConfig = chart.config.options?.plugins?.subtitle as any;
    const titleConfig = chart.config.options?.plugins?.title as any;

    // Only render if subtitle is enabled
    if (!subtitleConfig?.display) return;

    const text = subtitleConfig.text || '';
    if (!text) return;

    const ctx = chart.ctx;
    const chartArea = chart.chartArea;

    // Get title position to calculate subtitle position
    const titlePosition = titleConfig?.position || 'top';
    const titleDisplay = titleConfig?.display || false;

    // Get subtitle position and dimensions
    // Subtitle should follow title position by default
    const position = subtitleConfig.position || titlePosition || 'top';
    const align = subtitleConfig.align || titleConfig?.align || 'center';
    const padding = subtitleConfig.padding || 10;
    const font = subtitleConfig.font || {};
    const fontSize = font.size || 12;
    const fontFamily = font.family || 'Arial';
    const fontWeight = font.weight || '400';
    const color = subtitleConfig.color || '#666666';

    // Calculate title height if title is displayed and in same position
    let titleHeight = 0;
    let titleBottomPadding = 0;
    if (titleDisplay && titlePosition === position) {
      const titleFont = titleConfig?.font || {};
      const titleFontSize = titleFont.size || 16;
      const titlePadding = titleConfig?.padding || 10;
      titleHeight = titleFontSize + titlePadding;
      titleBottomPadding = titlePadding / 2; // Extra spacing between title and subtitle
    }

    // Calculate position
    let x = chartArea.left + (chartArea.right - chartArea.left) / 2;
    let y: number;

    if (position === 'top') {
      // Position subtitle below title if title is present
      y = padding + titleHeight + titleBottomPadding + fontSize / 2;
    } else {
      // Position subtitle above title if title is at bottom
      y = chart.height - padding - titleHeight - titleBottomPadding - fontSize / 2;
    }

    // Adjust x based on alignment
    if (align === 'start') {
      x = chartArea.left + padding;
    } else if (align === 'end') {
      x = chartArea.right - padding;
    }

    ctx.save();

    // Set font
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
    ctx.textBaseline = 'middle';

    // Draw the subtitle text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    ctx.restore();
  }
};

export default subtitlePlugin;

