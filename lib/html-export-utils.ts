import { useChartStore } from "./chart-store";
import { type HTMLExportOptions } from "./html-exporter";
import { generateChartHTML } from "./html-exporter";

export interface ExportResult {
  success: boolean;
  fileName: string;
  size: number;
  message: string;
  error?: string;
}

export interface BatchExportOptions {
  formats: ('html' | 'png' | 'svg' | 'json')[];
  htmlOptions?: HTMLExportOptions;
  zipFiles?: boolean;
}

/**
 * Validate HTML export options
 */
export function validateHTMLOptions(options: HTMLExportOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (options.width && (options.width < 100 || options.width > 3000)) {
    errors.push('Width must be between 100 and 3000 pixels');
  }
  
  if (options.height && (options.height < 100 || options.height > 3000)) {
    errors.push('Height must be between 100 and 3000 pixels');
  }
  
  if (options.title && options.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  if (options.fileName && !options.fileName.endsWith('.html')) {
    errors.push('File name must end with .html');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a unique filename
 */
export function generateUniqueFileName(prefix: string = 'chart', extension: string = 'html'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

/**
 * Sanitize HTML content for safe export
 */
export function sanitizeHTMLContent(content: string): string {
  // Remove any potentially dangerous scripts
  return content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '');
}

/**
 * Add custom CSS to HTML content
 */
export function injectCustomCSS(htmlContent: string, customCSS: string): string {
  if (!customCSS.trim()) return htmlContent;
  
  // Find the closing </style> tag and insert custom CSS before it
  const styleEndIndex = htmlContent.lastIndexOf('</style>');
  if (styleEndIndex !== -1) {
    return htmlContent.slice(0, styleEndIndex) + 
           '\n        ' + customCSS + '\n        ' + 
           htmlContent.slice(styleEndIndex);
  }
  
  // If no style tag found, add one in the head
  const headEndIndex = htmlContent.indexOf('</head>');
  if (headEndIndex !== -1) {
    return htmlContent.slice(0, headEndIndex) + 
           '\n    <style>\n        ' + customCSS + '\n    </style>\n    ' + 
           htmlContent.slice(headEndIndex);
  }
  
  return htmlContent;
}

/**
 * Add custom JavaScript to HTML content
 */
export function injectCustomJS(htmlContent: string, customJS: string): string {
  if (!customJS.trim()) return htmlContent;
  
  // Find the closing </script> tag and insert custom JS before it
  const scriptEndIndex = htmlContent.lastIndexOf('</script>');
  if (scriptEndIndex !== -1) {
    return htmlContent.slice(0, scriptEndIndex) + 
           '\n            ' + customJS + '\n            ' + 
           htmlContent.slice(scriptEndIndex);
  }
  
  // If no script tag found, add one before closing body
  const bodyEndIndex = htmlContent.indexOf('</body>');
  if (bodyEndIndex !== -1) {
    return htmlContent.slice(0, bodyEndIndex) + 
           '\n    <script>\n        ' + customJS + '\n    </script>\n    ' + 
           htmlContent.slice(bodyEndIndex);
  }
  
  return htmlContent;
}

/**
 * Create a self-contained HTML file with embedded resources
 */
export function createSelfContainedHTML(options: HTMLExportOptions): string {
  const { chartType, chartData, chartConfig } = useChartStore.getState();
  
  // This would require embedding Chart.js library as base64 or inline
  // For now, we'll use CDN with fallback
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Chart'}</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: ${options.backgroundColor || '#ffffff'};
        }
        .chart-container { 
            max-width: 100%; 
            overflow: hidden; 
            text-align: center;
        }
        canvas { 
            max-width: 100%; 
            height: auto; 
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .error-message {
            color: #d32f2f;
            background: #ffebee;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <h1>${options.title || 'Chart'}</h1>
        <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
        <div id="error" class="error-message" style="display: none;">
            <h3>Chart.js Library Not Available</h3>
            <p>This chart requires an internet connection to load the Chart.js library.</p>
        </div>
    </div>
    
    <script>
        // Try to load Chart.js from CDN
        function loadChartJS() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        loadChartJS().then(() => {
            const ctx = document.getElementById('chart').getContext('2d');
            new Chart(ctx, {
                type: '${chartType}',
                data: ${JSON.stringify(chartData)},
                options: ${JSON.stringify(chartConfig)}
            });
        }).catch(() => {
            document.getElementById('error').style.display = 'block';
        });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML with embedded data as JSON
 */
export function generateHTMLWithEmbeddedData(options: HTMLExportOptions): string {
  const { chartType, chartData, chartConfig } = useChartStore.getState();
  
  const embeddedData = {
    chartType,
    chartData,
    chartConfig,
    exportInfo: {
      generated: new Date().toISOString(),
      version: '1.0',
      source: 'AIChartor'
    }
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Chart with Embedded Data'}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: ${options.backgroundColor || '#ffffff'};
        }
        .container { 
            max-width: ${options.width || 800}px; 
            margin: 0 auto; 
        }
        .chart-container { 
            margin: 20px 0; 
            text-align: center;
        }
        canvas { 
            max-width: 100%; 
            height: auto; 
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .data-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .data-info h3 {
            margin-top: 0;
            color: #333;
        }
        .data-info pre {
            background: #fff;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${options.title || 'Chart with Embedded Data'}</h1>
        
        <div class="chart-container">
            <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
        </div>
        
        <div class="data-info">
            <h3>Embedded Chart Data</h3>
            <p>This chart contains all data embedded within the HTML file.</p>
            <pre>${JSON.stringify(embeddedData, null, 2)}</pre>
        </div>
    </div>
    
    <script>
        // Embedded chart data
        const embeddedData = ${JSON.stringify(embeddedData)};
        
        // Initialize chart
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chart').getContext('2d');
            new Chart(ctx, {
                type: embeddedData.chartType,
                data: embeddedData.chartData,
                options: embeddedData.chartConfig
            });
        });
    </script>
</body>
</html>`;
}

/**
 * Create a responsive HTML template
 */
export function createResponsiveHTML(options: HTMLExportOptions): string {
  const { chartType, chartData, chartConfig } = useChartStore.getState();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Responsive Chart'}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${options.backgroundColor || '#f8f9fa'};
            padding: 20px;
        }
        
        .container {
            max-width: ${options.width || 800}px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .chart-wrapper {
            padding: 30px;
            position: relative;
            height: ${options.height || 600}px;
        }
        
        .chart-container {
            position: relative;
            height: 100%;
            width: 100%;
        }
        
        canvas {
            max-width: 100% !important;
            height: auto !important;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .chart-wrapper {
                padding: 20px;
                height: 400px;
            }
        }
        
        @media (max-width: 480px) {
            .header h1 {
                font-size: 20px;
            }
            
            .chart-wrapper {
                padding: 15px;
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${options.title || 'Responsive Chart'}</h1>
            <p>Fully responsive chart that adapts to any screen size</p>
        </div>
        
        <div class="chart-wrapper">
            <div class="chart-container">
                <canvas id="chart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        
        const chart = new Chart(ctx, {
            type: '${chartType}',
            data: ${JSON.stringify(chartData)},
            options: {
                ...${JSON.stringify(chartConfig)},
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    ...${JSON.stringify(chartConfig.plugins || {})},
                    legend: {
                        display: ${options.includeLegend !== false},
                        position: 'top'
                    },
                    tooltip: {
                        enabled: ${options.includeTooltips !== false}
                    }
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            chart.resize();
        });
    </script>
</body>
</html>`;
}

/**
 * Export validation and error handling
 */
export function validateExport(options: HTMLExportOptions): ExportResult {
  const validation = validateHTMLOptions(options);
  
  if (!validation.valid) {
    return {
      success: false,
      fileName: '',
      size: 0,
      message: 'Export validation failed',
      error: validation.errors.join(', ')
    };
  }
  
  const { chartData } = useChartStore.getState();
  
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return {
      success: false,
      fileName: '',
      size: 0,
      message: 'No chart data available for export',
      error: 'Chart data is empty or invalid'
    };
  }
  
  return {
    success: true,
    fileName: options.fileName || generateUniqueFileName(),
    size: 0,
    message: 'Export validation passed'
  };
} 