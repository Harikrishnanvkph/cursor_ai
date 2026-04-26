import { Chart, ChartConfiguration } from 'chart.js';

export interface BackgroundImageConfig {
  type: 'image';
  imageUrl: string;
  imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  opacity?: number;
  imageWhiteBase?: boolean;
  blur?: number;
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'transparent';
  color?: string;
  // Legacy gradient properties
  gradientStart?: string;
  gradientEnd?: string;
  // New gradient properties
  gradientType?: 'linear' | 'radial';
  gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg';
  gradientColor1?: string;
  gradientColor2?: string;
  // Common properties
  opacity?: number;
  imageUrl?: string;
  imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  imageWhiteBase?: boolean;
  blur?: number;
}

export interface ExportPluginOptions {
  /**
   * Background configuration for the exported image
   * @default { type: 'color', color: '#ffffff' }
   */
  background?: BackgroundConfig;

  /**
   * File name prefix for the exported image
   * @default 'chart'
   */
  fileNamePrefix?: string;

  /**
   * Image quality (0-1)
   * @default 1.0
   */
  quality?: number;
}

/**
 * Plugin to handle chart export with background
 */
const exportPlugin = {
  id: 'exportWithBackground',

  /**
   * Default plugin options
   */
  defaults: {
    background: {
      type: 'color',
      color: '#ffffff',
      opacity: 1
    },
    fileNamePrefix: 'chart',
    quality: 1.0
  } as ExportPluginOptions,

  /**
   * Called when the chart is initialized
   */
  beforeInit(chart: Chart, _args: any, options: ExportPluginOptions) {
    // Merge defaults with provided options
    const pluginOptions = {
      ...this.defaults,
      ...options
    };

    // Add export method to chart instance
    chart.exportToImage = async (options?: Partial<ExportPluginOptions>) => {
      const exportOptions = { ...pluginOptions, ...options };
      const canvas = chart.canvas;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        console.error('Failed to create temporary canvas');
        return;
      }

      try {
        const background = exportOptions.background || { type: 'color', color: '#ffffff' };
        const opacity = (background.opacity ?? 100) / 100;

        // Draw background based on type
        if (background.type === 'color' && background.color) {
          console.log(background.imageWhiteBase)
          tempCtx.fillStyle = background.color;
          tempCtx.globalAlpha = opacity;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.globalAlpha = 1.0;
        }
        else if (background.type === 'gradient') {
          const gradientType = background.gradientType || 'linear';
          const color1 = background.gradientColor2 || background.gradientStart || '#000000';
          const color2 = background.gradientColor1 || background.gradientEnd || '#ffffff';
          const direction = background.gradientDirection || 'to bottom';

          console.log('Drawing gradient background:', {
            type: gradientType,
            direction,
            color1,
            color2,
            opacity
          });

          try {
            if (gradientType === 'radial') {
              // Radial gradient
              const gradient = tempCtx.createRadialGradient(
                tempCanvas.width / 2, // Center X
                tempCanvas.height / 2, // Center Y
                0, // Start radius
                tempCanvas.width / 2, // End X
                tempCanvas.height / 2, // End Y
                Math.max(tempCanvas.width, tempCanvas.height) // End radius
              );
              gradient.addColorStop(0, color2);
              gradient.addColorStop(1, color1);

              tempCtx.fillStyle = gradient;
            } else {
              // Linear gradient
              let x0 = 0, y0 = 0, x1 = 0, y1 = 0;

              // Set gradient direction based on the direction string
              // Note: The y-coordinates are inverted because canvas origin (0,0) is top-left
              switch (direction) {
                case 'to right':
                  x0 = 0; y0 = 0;
                  x1 = tempCanvas.width; y1 = 0;
                  break;
                case 'to left':
                  x0 = tempCanvas.width; y0 = 0;
                  x1 = 0; y1 = 0;
                  break;
                case 'to bottom':
                  // Top to Bottom
                  x0 = 0; y0 = 0;
                  x1 = 0; y1 = tempCanvas.height;
                  break;
                case 'to top':
                  // Bottom to Top
                  x0 = 0; y0 = tempCanvas.height;
                  x1 = 0; y1 = 0;
                  break;
                case '135deg':
                  x0 = 0; y0 = 0;
                  x1 = tempCanvas.width; y1 = tempCanvas.height;
                  break;
                default:
                  // Default to top to bottom
                  x0 = 0; y0 = 0;
                  x1 = 0; y1 = tempCanvas.height;
              }

              const gradient = tempCtx.createLinearGradient(x0, y0, x1, y1);
              // Swap the color stops to match the preview
              gradient.addColorStop(0, color2);
              gradient.addColorStop(1, color1);

              tempCtx.fillStyle = gradient;
            }

            tempCtx.globalAlpha = opacity;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.globalAlpha = 1.0;
            console.log('Gradient background drawn successfully');
          } catch (error) {
            console.error('Error drawing gradient background:', error);
            // Fallback to solid color
            tempCtx.fillStyle = '#ff0000';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          }
        }
        else if (background.type === 'image' && background.imageUrl) {
          console.log('Exporting with background image:', background);
          try {
            // Draw white base if enabled
            console.log(background.imageWhiteBase)
            if (background.imageWhiteBase !== false) {
              console.log('Drawing white base for image background');
              tempCtx.fillStyle = '#ffffff';
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            }

            // Load and draw the background image
            console.log('Loading background image from URL:', background.imageUrl);
            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';

              img.onload = () => {
                console.log('Background image loaded successfully');
                const fit = background.imageFit || 'cover';
                let dx = 0, dy = 0, dWidth = tempCanvas.width, dHeight = tempCanvas.height;
                const canvasAspect = tempCanvas.width / tempCanvas.height;
                const imgAspect = img.width / img.height;

                if (fit === 'fill') {
                  // Use full canvas dimensions
                }
                else if (fit === 'contain') {
                  if (imgAspect > canvasAspect) {
                    dWidth = tempCanvas.width;
                    dHeight = dWidth / imgAspect;
                    dy = (tempCanvas.height - dHeight) / 2;
                  } else {
                    dHeight = tempCanvas.height;
                    dWidth = dHeight * imgAspect;
                    dx = (tempCanvas.width - dWidth) / 2;
                  }
                }
                else if (fit === 'cover') {
                  if (imgAspect > canvasAspect) {
                    dHeight = tempCanvas.height;
                    dWidth = dHeight * imgAspect;
                    dx = (tempCanvas.width - dWidth) / 2;
                  } else {
                    dWidth = tempCanvas.width;
                    dHeight = dWidth / imgAspect;
                    dy = (tempCanvas.height - dHeight) / 2;
                  }
                }

                console.log('Drawing image with dimensions:', { dx, dy, dWidth, dHeight, imgWidth: img.width, imgHeight: img.height });

                // Apply blur if specified
                if (background.blur) {
                  tempCtx.filter = `blur(${background.blur}px)`;
                }

                tempCtx.globalAlpha = opacity;
                tempCtx.drawImage(img, dx, dy, dWidth, dHeight);
                tempCtx.globalAlpha = 1.0;

                // Reset filter
                tempCtx.filter = 'none';

                console.log('Background image drawn successfully');
                resolve();
              };

              img.onerror = (error) => {
                console.error('Error loading background image:', error);
                reject(error);
              };

              img.src = background.imageUrl;
            });
          } catch (error) {
            console.error('Error processing background image:', error);
            // Fallback to solid color if image fails to load
            console.log('Falling back to solid color background due to error');
            tempCtx.fillStyle = '#ff0000'; // Using red to make it obvious if fallback is used
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          }
        }

        // Draw the chart on top of the background
        tempCtx.drawImage(canvas, 0, 0);

        // Composite decoration shapes (SVG overlay) on top of the chart
        // The decoration layer is a separate SVG element rendered by DecorationShapeRenderer
        try {
          // Walk up the DOM tree from the canvas to find the nearest ancestor
          // that contains a decoration SVG (identified by its viewBox attribute)
          let decorationSvg: SVGSVGElement | null = null;
          let ancestor: HTMLElement | null = canvas.parentElement;
          for (let i = 0; i < 6 && ancestor && !decorationSvg; i++) {
            decorationSvg = ancestor.querySelector('svg[viewBox]') as SVGSVGElement | null;
            ancestor = ancestor.parentElement;
          }

          if (decorationSvg) {
            // Clone the SVG to avoid modifying the live DOM
            const svgClone = decorationSvg.cloneNode(true) as SVGSVGElement;

            // Remove UI-only elements: selection handles, toolbars, drawing previews, 
            // grid, cursor tracker, marquee, and the anti-pixelation text anchor
            const uiSelectors = [
              '[data-export-ignore="true"]', // Toolbars
              '[data-selection]',        // Selection handles
              '[data-drawing-preview]',  // Drawing preview
              'line[stroke-dasharray]',  // Grid lines (dashed)
              '[data-cursor]',           // Cursor tracker
              '[data-marquee]',          // Marquee selection
            ];
            uiSelectors.forEach(selector => {
              svgClone.querySelectorAll(selector).forEach(el => el.remove());
            });

            // Remove the anti-pixelation text anchor (fontSize="1")
            svgClone.querySelectorAll('text[aria-hidden="true"]').forEach(el => el.remove());

            // Set explicit dimensions on the SVG for rendering
            svgClone.setAttribute('width', String(canvas.width));
            svgClone.setAttribute('height', String(canvas.height));
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Inline any computed styles needed for rendering
            // (SVG serialization doesn't carry CSS classes)
            const allElements = svgClone.querySelectorAll('*');
            allElements.forEach((el) => {
              // Ensure fill/stroke attributes are present since CSS won't carry over
              const htmlEl = el as HTMLElement;
              if (htmlEl.style) {
                const computed = getComputedStyle(el);
                // Only set if not already explicitly set
                if (!el.getAttribute('fill') && computed.fill) {
                  el.setAttribute('fill', computed.fill);
                }
                if (!el.getAttribute('stroke') && computed.stroke && computed.stroke !== 'none') {
                  el.setAttribute('stroke', computed.stroke);
                }
              }
            });

            // Serialize SVG to a data URL
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Render SVG to image and composite
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                URL.revokeObjectURL(svgUrl);
                resolve();
              };
              img.onerror = () => {
                console.warn('Failed to render decoration SVG overlay for export');
                URL.revokeObjectURL(svgUrl);
                resolve(); // Don't block export if decoration rendering fails
              };
              img.src = svgUrl;
            });
          }
        } catch (decorationError) {
          console.warn('Could not composite decoration shapes:', decorationError);
          // Non-fatal: export without decorations if compositing fails
        }

        // Create download link
        const url = tempCanvas.toDataURL('image/png', exportOptions.quality);
        const link = document.createElement('a');
        link.download = `${exportOptions.fileNamePrefix}-${Date.now()}.png`;
        link.href = url;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error exporting chart:', error);
      }
    };
  },

  /**
   * Clean up when the chart is destroyed
   */
  destroy(chart: Chart) {
    // Clean up any added properties
    if ('exportToImage' in chart) {
      delete (chart as any).exportToImage;
    }
  }
};

// Extend Chart type to include our new method
declare module 'chart.js' {
  interface Chart {
    exportToImage?: (options?: Partial<ExportPluginOptions>) => void;
  }
}

export default exportPlugin;
