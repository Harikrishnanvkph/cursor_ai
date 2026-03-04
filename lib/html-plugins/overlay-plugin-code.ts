/**
 * Generate the overlay plugin code for HTML export
 */
export function generateOverlayPluginCode(overlayConfig: any): string {
  if (!overlayConfig || (!overlayConfig.overlayImages?.length && !overlayConfig.overlayTexts?.length && !overlayConfig.overlayShapes?.length)) {
    return '';
  }

  return `
// Overlay Plugin for HTML Export
const overlayPlugin = {
  id: 'overlayPlugin',
  
  afterDraw(chart) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    const pluginConfig = ${JSON.stringify(overlayConfig)};
    const overlayImages = pluginConfig.overlayImages || [];
    const overlayTexts = pluginConfig.overlayTexts || [];
    const overlayShapes = pluginConfig.overlayShapes || [];
    
    // Combine all overlays into a single array for z-index sorting
    const combinedOverlays = [];
    
    if (overlayImages.length > 0) {
      combinedOverlays.push(...overlayImages.map((img) => ({ ...img, _type: 'image' })));
    }
    if (overlayTexts.length > 0) {
      combinedOverlays.push(...overlayTexts.map((txt) => ({ ...txt, _type: 'text' })));
    }
    if (overlayShapes.length > 0) {
      combinedOverlays.push(...overlayShapes.map((shape) => ({ ...shape, _type: 'shape' })));
    }

    // Sort by zIndex
    combinedOverlays.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Helper functions for opacity and shapes
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
    };

    const applyOpacity = (color, opacityPercent) => {
      if (!color || color === 'transparent') return 'transparent';
      const alpha = opacityPercent / 100;
      if (color.startsWith('#')) return hexToRgba(color, alpha);
      if (color.startsWith('rgba')) return color.replace(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*[\\d.]+\\)/, \`rgba($1, $2, $3, \${alpha})\`);
      if (color.startsWith('rgb')) return color.replace(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/, \`rgba($1, $2, $3, \${alpha})\`);
      return color;
    };

    const drawCloud = (context, x, y, w, h) => {
      context.moveTo(x + w * 0.2, y + h * 0.8);
      context.bezierCurveTo(x + w * 0.1, y + h * 0.8, x + w * 0.1, y + h * 0.5, x + w * 0.3, y + h * 0.5);
      context.bezierCurveTo(x + w * 0.3, y + h * 0.2, x + w * 0.7, y + h * 0.2, x + w * 0.7, y + h * 0.5);
      context.bezierCurveTo(x + w * 0.9, y + h * 0.5, x + w * 0.9, y + h * 0.8, x + w * 0.8, y + h * 0.8);
      context.closePath();
    };

    const drawStar = (context, cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      context.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
      context.lineTo(cx, cy - outerRadius);
      context.closePath();
    };

    // Render in zIndex order
    combinedOverlays.forEach((overlay) => {
      if (!overlay.visible) return;

      if (overlay._type === 'image') {
        const image = overlay;
        const x = chartArea.left + image.x;
        const y = chartArea.top + image.y;
        const w = image.width;
        const h = image.height;
        
        // Create image element
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          ctx.save();
          
          // Apply transformations
          if (image.rotation) {
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(image.rotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
          }
          
          // Draw border if specified
          if (image.borderWidth > 0) {
            ctx.strokeStyle = image.borderColor;
            ctx.lineWidth = image.borderWidth;
            
            if (image.shape === 'circle') {
              const centerX = x + w / 2;
              const centerY = y + h / 2;
              const radius = Math.min(w, h) / 2;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.stroke();
            } else {
              ctx.strokeRect(x, y, w, h);
            }
          }
          
          // Draw image with shape clipping
          if (image.shape === 'circle') {
            const centerX = x + w / 2;
            const centerY = y + h / 2;
            const radius = Math.min(w, h) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
          } else if (image.shape === 'rounded') {
            const radius = Math.min(w, h) * 0.1;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            ctx.clip();
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
          } else {
            // Rectangle shape
            ctx.drawImage(img, x, y, w, h);
          }
          
          ctx.restore();
        };
        
        img.src = image.url;
      } else if (overlay._type === 'text') {
        const text = overlay;
        const x = chartArea.left + text.x;
        const y = chartArea.top + text.y;
        
        ctx.save();
        
        // Apply transformations later once we know the exact text bounds
        
        // Set font properties
        ctx.font = \`\${text.fontSize}px \${text.fontFamily}\`;
        ctx.fillStyle = text.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Handle text wrapping
        const maxWidth = text.maxWidth || 200;
        const words = text.text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine ? currentLine + ' ' + word : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Calculate total dimensions
        const lineHeight = text.fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        
        const paddingX = text.paddingX || 8;
        const paddingY = text.paddingY || 4;
        const bgWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + (paddingX * 2);
        const bgHeight = totalHeight + (paddingY * 2);
        const bgX = x - paddingX;
        const bgY = y - paddingY;
        
        // Apply center-pivoted transformations
        if (text.rotation) {
          const cx = bgX + bgWidth / 2;
          const cy = bgY + bgHeight / 2;
          ctx.translate(cx, cy);
          ctx.rotate(text.rotation * Math.PI / 180);
          ctx.translate(-cx, -cy);
        }
        
        // Draw background if not transparent
        if (!text.backgroundTransparent && text.backgroundColor) {
          ctx.fillStyle = text.backgroundColor;
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          
          // Reset fill style for text
          ctx.fillStyle = text.color;
        }
        
        // Draw border if specified
        if (text.borderWidth > 0) {
          ctx.strokeStyle = text.borderColor;
          ctx.lineWidth = text.borderWidth;
          ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
        }
        
        // Draw text lines
        lines.forEach((line, index) => {
          const lineY = y + (index * lineHeight);
          ctx.fillText(line, x, lineY);
        });
        
        ctx.restore();
      } else if (overlay._type === 'shape') {
        const shape = overlay;
        const x = chartArea.left + shape.x;
        const y = chartArea.top + shape.y;
        const w = shape.width;
        const h = shape.height;

        const cx = x + w / 2;
        const cy = y + h / 2;

        ctx.save();

        ctx.translate(cx, cy);
        if (shape.rotation) {
          ctx.rotate((shape.rotation * Math.PI) / 180);
        }

        if (shape.skewX || shape.skewY) {
          const skewXRad = ((shape.skewX || 0) * Math.PI) / 180;
          const skewYRad = ((shape.skewY || 0) * Math.PI) / 180;
          ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
        }

        ctx.translate(-cx, -cy);

        ctx.fillStyle = applyOpacity(shape.fillColor, shape.fillOpacity ?? 100);
        ctx.strokeStyle = shape.borderColor || '#000000';
        ctx.lineWidth = shape.borderWidth || 0;
        ctx.globalAlpha = 1;

        if (shape.borderStyle === 'dashed') {
          ctx.setLineDash([8, 8]);
        } else if (shape.borderStyle === 'dotted') {
          ctx.setLineDash([2, 4]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();

        switch (shape.type) {
          case 'rectangle':
          case 'square':
            ctx.rect(x, y, w, h);
            break;
          case 'circle':
            ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);
            break;
          case 'cloud':
            drawCloud(ctx, x, y, w, h);
            break;
          case 'star':
            drawStar(ctx, cx, cy, 5, w / 2, w / 4);
            break;
          case 'line':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            break;
          case 'lineArrow':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            const arrowSize = Math.max(10, Math.min(w * 0.2, 20));
            ctx.moveTo(x + w - arrowSize, cy - arrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - arrowSize, cy + arrowSize / 2);
            break;
          case 'lineDoubleArrow':
            ctx.moveTo(x, cy);
            ctx.lineTo(x + w, cy);
            const doubleArrowSize = Math.max(10, Math.min(w * 0.2, 20));
            ctx.moveTo(x + w - doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x + w, cy);
            ctx.lineTo(x + w - doubleArrowSize, cy + doubleArrowSize / 2);
            ctx.moveTo(x + doubleArrowSize, cy - doubleArrowSize / 2);
            ctx.lineTo(x, cy);
            ctx.lineTo(x + doubleArrowSize, cy + doubleArrowSize / 2);
            break;
          case 'freehand':
            if (shape.points && shape.points.length > 0) {
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              ctx.moveTo(x + shape.points[0].x * w, y + shape.points[0].y * h);

              if (shape.points.length < 3) {
                for (let i = 1; i < shape.points.length; i++) {
                  ctx.lineTo(x + shape.points[i].x * w, y + shape.points[i].y * h);
                }
              } else {
                for (let i = 1; i < shape.points.length - 1; i++) {
                  const pt = shape.points[i];
                  const nextPt = shape.points[i + 1];
                  const midX = (pt.x + nextPt.x) / 2;
                  const midY = (pt.y + nextPt.y) / 2;
                  ctx.quadraticCurveTo(
                    x + pt.x * w, y + pt.y * h,
                    x + midX * w, y + midY * h
                  );
                }
                const lastPt = shape.points[shape.points.length - 1];
                ctx.lineTo(x + lastPt.x * w, y + lastPt.y * h);
              }
            }
            break;
          default:
            ctx.rect(x, y, w, h);
        }

        if (shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' || shape.type === 'freehand') {
          ctx.stroke();
        } else {
          if (shape.fillColor !== 'transparent' && shape.fillColor) {
            ctx.fill();
          }
          if (shape.borderWidth > 0) {
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    });
  }
};

// Register the overlay plugin
Chart.register(overlayPlugin);
`;
}
