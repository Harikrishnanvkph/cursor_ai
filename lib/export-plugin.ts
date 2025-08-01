import { Chart, ChartConfiguration } from 'chart.js';

export interface BackgroundImageConfig {
  type: 'image';
  imageUrl: string;
  imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  opacity?: number;
  imageWhiteBase?: boolean;
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
    chart.exportToImage = async (options?: Partial<ExportPluginOptions> & { customWidth?: number; customHeight?: number }) => {
      const exportOptions = { ...pluginOptions, ...options };
      const canvas = chart.canvas;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Get device pixel ratio and calculate target dimensions
      const dpr = window.devicePixelRatio || 1;
      const customWidth = options?.customWidth;
      const customHeight = options?.customHeight;
      
      // Calculate target dimensions with quality multiplier
      const qualityMultiplier = options?.quality === 1.0 ? 1 : 1; // Use 1x for best quality
      let targetWidth, targetHeight;
      
      if (customWidth && customHeight) {
        targetWidth = customWidth * dpr;
        targetHeight = customHeight * dpr;
      } else {
        // Use original canvas dimensions without scaling for best quality
        targetWidth = canvas.width;
        targetHeight = canvas.height;
      }
      
      console.log('🔄 Starting high-quality export...');
      console.log('📊 Original canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('🎯 Target dimensions:', targetWidth, 'x', targetHeight);
      console.log('📈 Quality multiplier:', qualityMultiplier);
      
      try {
        // Create a new canvas at the target resolution
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetWidth;
        exportCanvas.height = targetHeight;
        
        const exportCtx = exportCanvas.getContext('2d');
        
        if (!exportCtx) {
          console.error('Failed to create export canvas context');
          return;
        }

        // Draw background first
        const background = exportOptions.background || { type: 'color', color: '#ffffff' };
        const opacity = (background.opacity ?? 100) / 100;
        
        if (background.type === 'color' && background.color) {
          console.log('🎨 Drawing solid background:', background.color);
          exportCtx.fillStyle = background.color;
          exportCtx.globalAlpha = opacity;
          exportCtx.fillRect(0, 0, targetWidth, targetHeight);
          exportCtx.globalAlpha = 1.0;
        } else if (background.type === 'gradient') {
          console.log('🎨 Drawing gradient background');
          // Handle gradient background
          const gradientType = background.gradientType || 'linear';
          const color1 = background.gradientColor2 || background.gradientStart || '#000000';
          const color2 = background.gradientColor1 || background.gradientEnd || '#ffffff';
          const direction = background.gradientDirection || 'to bottom';
          
          if (gradientType === 'radial') {
            const gradient = exportCtx.createRadialGradient(
              targetWidth / 2, targetHeight / 2, 0,
              targetWidth / 2, targetHeight / 2, Math.max(targetWidth, targetHeight)
            );
            gradient.addColorStop(0, color2);
            gradient.addColorStop(1, color1);
            exportCtx.fillStyle = gradient;
          } else {
            let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
            switch (direction) {
              case 'to right': x0 = 0; y0 = 0; x1 = targetWidth; y1 = 0; break;
              case 'to left': x0 = targetWidth; y0 = 0; x1 = 0; y1 = 0; break;
              case 'to bottom': x0 = 0; y0 = 0; x1 = 0; y1 = targetHeight; break;
              case 'to top': x0 = 0; y0 = targetHeight; x1 = 0; y1 = 0; break;
              case '135deg': x0 = 0; y0 = 0; x1 = targetWidth; y1 = targetHeight; break;
              default: x0 = 0; y0 = 0; x1 = 0; y1 = targetHeight;
            }
            const gradient = exportCtx.createLinearGradient(x0, y0, x1, y1);
            gradient.addColorStop(0, color2);
            gradient.addColorStop(1, color1);
            exportCtx.fillStyle = gradient;
          }
          exportCtx.globalAlpha = opacity;
          exportCtx.fillRect(0, 0, targetWidth, targetHeight);
          exportCtx.globalAlpha = 1.0;
        }
        
        // Use the browser's native high-DPI rendering
        exportCtx.imageSmoothingEnabled = true;
        exportCtx.imageSmoothingQuality = 'high';
        
        // Force chart to render at maximum quality before export
        chart.update('none');
        
        // Draw the chart at original resolution for best quality
        if (customWidth && customHeight) {
          // For custom dimensions, scale the chart to fit
          const scaleX = targetWidth / canvas.width;
          const scaleY = targetHeight / canvas.height;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const offsetX = (targetWidth - scaledWidth) / 2;
          const offsetY = (targetHeight - scaledHeight) / 2;
          
          exportCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
        } else {
          // For standard quality, draw at original resolution
          exportCtx.drawImage(canvas, 0, 0);
        }
        
        console.log('💾 Creating download link...');
        // Create download link with maximum quality
        const url = exportCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${exportOptions.fileNamePrefix}-${Date.now()}.png`;
        link.href = url;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ High-quality export completed successfully');
        
      } catch (error) {
        console.error('❌ Error during export:', error);
        // Fallback to original method if export fails
        console.log('🔄 Falling back to original export method...');
        try {
          const url = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = `${exportOptions.fileNamePrefix}-${Date.now()}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log('✅ Fallback export completed');
        } catch (fallbackError) {
          console.error('❌ Fallback export also failed:', fallbackError);
        }
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
    exportToImage?: (options?: Partial<ExportPluginOptions> & { customWidth?: number; customHeight?: number }) => void;
  }
}

export default exportPlugin;
