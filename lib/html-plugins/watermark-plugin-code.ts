export function generateWatermarkPluginCode(): string {
    return `
// Cache to prevent reloading images continuously during chart re-renders
const imageCache = new Map();

const watermarkPlugin = {
  id: 'watermark',
  afterDraw(chart, args, options) {
    if (!options) return;

    const { ctx, width, height, chartArea } = chart;
    const { position, opacity, size, color, imageUrl, style, spacingX, spacingY, angle } = options;
    const text = options.text || (!imageUrl ? 'Watermark' : '');
    const spX = typeof spacingX === 'number' ? spacingX : 50;
    const spY = typeof spacingY === 'number' ? spacingY : 50;
    const rotAngle = typeof angle === 'number' ? angle : -30; // Default angle is -30 degrees
    const rotRadians = (rotAngle * Math.PI) / 180;

    // We need either text or an image URL to draw something
    if (!text && !imageUrl) return;

    ctx.save();
    
    // Default opacity is 30% if not specified or invalid
    ctx.globalAlpha = typeof opacity === 'number' ? opacity / 100 : 0.3;

    if (imageUrl) {
      let img = imageCache.get(imageUrl);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
          imageCache.set(imageUrl, img);
          // Trigger a re-draw once the image is loaded
          chart.draw();
        };
        img.onerror = () => {
          console.warn(\`[WatermarkPlugin] Failed to load image: \${imageUrl}\`);
        };
        imageCache.set(imageUrl, img);
        ctx.restore();
        return; // Don't draw yet
      }

      // Ensure the image has actually loaded and has dimensions
      if (img.complete && img.naturalWidth > 0) {
        // Calculate size maintaining aspect ratio
        const imgWidth = size ? size * (img.naturalWidth / img.naturalHeight) : img.naturalWidth;
        const imgHeight = size || img.naturalHeight;

        if (style === 'tiled') {
          // Draw tiled pattern across the canvas
          ctx.translate(width / 2, height / 2);
          ctx.rotate(rotRadians);
          ctx.translate(-width, -height);

          for (let x = -width; x < width * 3; x += imgWidth + spX) {
            for (let y = -height; y < height * 3; y += imgHeight + spY) {
              ctx.drawImage(img, x, y, imgWidth, imgHeight);
            }
          }
        } else {
          // Draw single image at specified position
          let x = 0, y = 0;
          const padding = 10;
          switch (position) {
            case 'top-left':
              x = padding;
              y = padding;
              break;
            case 'top-right':
              x = width - imgWidth - padding;
              y = padding;
              break;
            case 'bottom-left':
              x = padding;
              y = height - imgHeight - padding;
              break;
            case 'center':
              x = (width - imgWidth) / 2;
              y = (height - imgHeight) / 2;
              break;
            case 'bottom-right':
            default:
              x = width - imgWidth - padding;
              y = height - imgHeight - padding;
              break;
          }
          ctx.translate(x + imgWidth / 2, y + imgHeight / 2);
          ctx.rotate(rotRadians);
          ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        }
      }
    } else if (text) {
      const fontSize = size || 24;
      ctx.fillStyle = color || '#cccccc';
      ctx.font = \`bold \${fontSize}px sans-serif\`;
      ctx.textBaseline = 'middle';

      if (style === 'tiled') {
        const textWidth = ctx.measureText(text).width;
        // Move origin to center, rotate, and draw a grid of text
        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotRadians); 
        ctx.translate(-width, -height);
        
        for (let x = -width; x < width * 3; x += textWidth + spX) {
          for (let y = -height; y < height * 3; y += fontSize + spY) {
            ctx.fillText(text, x, y);
          }
        }
      } else {
        const padding = 20;
        let x = 0, y = 0;
        switch (position) {
          case 'top-left':
            x = padding;
            y = padding + fontSize / 2;
            ctx.textAlign = 'left';
            break;
          case 'top-right':
            x = width - padding;
            y = padding + fontSize / 2;
            ctx.textAlign = 'right';
            break;
          case 'bottom-left':
            x = padding;
            y = height - padding - fontSize / 2;
            ctx.textAlign = 'left';
            break;
          case 'center':
            x = width / 2;
            y = height / 2;
            ctx.textAlign = 'center';
            break;
          case 'bottom-right':
          default:
            x = width - padding;
            y = height - padding - fontSize / 2;
            ctx.textAlign = 'right';
            break;
        }
        ctx.translate(x, y);
        ctx.rotate(rotRadians);
        ctx.fillText(text, 0, 0);
      }
    }

    ctx.restore();
  }
};
Chart.register(watermarkPlugin);
`;
}
