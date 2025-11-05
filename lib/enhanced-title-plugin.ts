// Enhanced Title Plugin for Chart.js
// Adds support for text shadow, outline (stroke), and rotation

import { Chart, Plugin } from 'chart.js';

export const enhancedTitlePlugin: Plugin = {
  id: 'enhancedTitle',
  
  beforeDraw: (chart: Chart, args: any, options: any) => {
    const titleConfig = chart.config.options?.plugins?.title as any;
    
    // Only render if title is enabled and we have enhanced features
    if (!titleConfig?.display) return;
    
    const hasEnhancedFeatures = titleConfig.shadow || titleConfig.stroke || 
                                (titleConfig.rotation !== false && titleConfig.rotation !== undefined);
    if (!hasEnhancedFeatures) return;
    
    // Hide the default title by temporarily setting display to false
    titleConfig._originalDisplay = titleConfig.display;
    titleConfig.display = false;
    
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const text = titleConfig.text || '';
    
    if (!text) return;
    
    // Get title position and dimensions
    const position = titleConfig.position || 'top';
    const align = titleConfig.align || 'center';
    const padding = titleConfig.padding || 10;
    const font = titleConfig.font || {};
    const fontSize = font.size || 16;
    const fontFamily = font.family || 'Arial';
    const fontWeight = font.weight || '700';
    const color = titleConfig.color || '#000000';
    
    // Calculate position
    let x = chartArea.left + (chartArea.right - chartArea.left) / 2;
    let y = position === 'top' ? padding + fontSize / 2 : chart.height - padding - fontSize / 2;
    
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
    
    // Apply rotation if specified
    if (titleConfig.rotation !== false && titleConfig.rotation !== undefined) {
      ctx.translate(x, y);
      ctx.rotate((titleConfig.rotation * Math.PI) / 180);
      x = 0;
      y = 0;
    }
    
    // Apply text shadow
    if (titleConfig.shadow) {
      const shadow = titleConfig.shadow;
      ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = shadow.blur || 4;
      ctx.shadowOffsetX = shadow.offsetX || 2;
      ctx.shadowOffsetY = shadow.offsetY || 2;
    }
    
    // Apply text outline (stroke)
    if (titleConfig.stroke) {
      const stroke = titleConfig.stroke;
      ctx.strokeStyle = stroke.color || '#000000';
      ctx.lineWidth = stroke.width || 1;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, x, y);
    }
    
    // Draw the main text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    // Reset shadow to avoid affecting other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.restore();
  },
  
  afterDraw: (chart: Chart, args: any, options: any) => {
    const titleConfig = chart.config.options?.plugins?.title as any;
    
    // Restore the original display setting
    if (titleConfig?._originalDisplay !== undefined) {
      titleConfig.display = titleConfig._originalDisplay;
      delete titleConfig._originalDisplay;
    }
  }
};

export default enhancedTitlePlugin;

