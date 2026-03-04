/**
 * Generate the subtitle plugin code for HTML export
 */
export function generateSubtitlePluginCode(subtitleConfig: any, titleConfig: any): string {
    if (!subtitleConfig || !subtitleConfig.display || !subtitleConfig.text) {
        return '';
    }

    return `
// Subtitle Plugin for HTML Export
const subtitlePlugin = {
  id: 'subtitle',
  beforeDraw(chart) {
    const subtitleConfig = chart.config.options?.plugins?.subtitle;
    const titleConfig = chart.config.options?.plugins?.title;
    
    if (!subtitleConfig?.display || !subtitleConfig?.text) return;
    
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const text = subtitleConfig.text || '';
    if (!text) return;
    
    // Get title position to calculate subtitle position
    const titlePosition = titleConfig?.position || 'top';
    const titleDisplay = titleConfig?.display || false;
    
    // Get subtitle position and dimensions
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
      titleBottomPadding = titlePadding / 2;
    }
    
    // Calculate position
    let x = chartArea.left + (chartArea.right - chartArea.left) / 2;
    let y;
    
    if (position === 'top') {
      y = padding + titleHeight + titleBottomPadding + fontSize / 2;
    } else {
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
    ctx.font = \`\${fontWeight} \${fontSize}px \${fontFamily}\`;
    ctx.textAlign = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
    ctx.textBaseline = 'middle';
    
    // Draw the subtitle text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
  }
};

Chart.register(subtitlePlugin);
`;
}
