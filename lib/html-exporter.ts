import { useChartStore } from "./chart-store";
import { type ExtendedChartData, type SupportedChartType } from "./chart-store";
import { chartTypeMapping } from "./chart-store";
import { htmlTemplates, type HTMLTemplate } from "./html-templates";
import { generateCompletePluginSystem } from "./html-plugins";

// Shared function to generate custom labels
function generateCustomLabelsFromConfig(chartConfig: any, chartData: any, legendFilter: any) {
  const customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};
  
  if (customLabelsConfig.display === false) {
    return [];
  }

  // Filter datasets based on legend filter
  const filteredDatasets = chartData.datasets.filter((_, index) => 
    legendFilter.datasets[index] !== false
  );

  return filteredDatasets.map((ds, datasetIdx) =>
    ds.data.map((value, pointIdx) => {
      let text = String(value);
      
      // Label content logic
      if (customLabelsConfig.labelContent === 'label') {
        text = String(chartData.labels?.[pointIdx] ?? text);
      } else if (customLabelsConfig.labelContent === 'percentage') {
        const total = ds.data.reduce((a: number, b: any) => {
          if (typeof b === 'number') return a + b;
          if (b && typeof b === 'object' && 'y' in b && typeof b.y === 'number') return a + b.y;
          return a;
        }, 0);
        let val = 0;
        if (typeof value === 'number') val = value;
        else if (value && typeof value === 'object' && 'y' in value && typeof value.y === 'number') val = value.y;
        text = ((val / total) * 100).toFixed(1) + '%';
      } else if (customLabelsConfig.labelContent === 'index') {
        text = String(pointIdx + 1);
      } else if (customLabelsConfig.labelContent === 'dataset') {
        text = ds.label ?? text;
      }
      
      // Prefix/suffix
      if (customLabelsConfig.prefix) text = customLabelsConfig.prefix + text;
      if (customLabelsConfig.suffix) text = text + customLabelsConfig.suffix;
      
      // Styling
      let color = customLabelsConfig.color || '#222';
      let backgroundColor = customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.backgroundColor || '#fff');
      let borderColor = customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.borderColor || '#333');
      
      return {
        text,
        anchor: customLabelsConfig.anchor || 'center',
        shape: customLabelsConfig.shape || 'none',
        align: customLabelsConfig.align || 'center',
        color,
        backgroundColor,
        borderColor,
        borderWidth: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderWidth ?? 2),
        borderRadius: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderRadius ?? 6),
        padding: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.padding ?? 6),
        font: `${customLabelsConfig.fontWeight || 'bold'} ${customLabelsConfig.fontSize || 14}px ${customLabelsConfig.fontFamily || 'Arial'}`,
        // Enhanced callout properties
        callout: customLabelsConfig.anchor === 'callout',
        calloutColor: customLabelsConfig.calloutColor || '#333',
        draggable: customLabelsConfig.anchor === 'callout',
        arrowLine: customLabelsConfig.arrowLine !== false,
        arrowHead: customLabelsConfig.arrowHead !== false,
        arrowColor: customLabelsConfig.arrowColor || customLabelsConfig.calloutColor || '#333',
        calloutOffset: customLabelsConfig.calloutOffset || 48,
        arrowEndGap: customLabelsConfig.arrowEndGap || 0,
      };
    })
  );
}

export interface HTMLExportOptions {
  title?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeResponsive?: boolean;
  includeAnimations?: boolean;
  includeTooltips?: boolean;
  includeLegend?: boolean;
  customCSS?: string;
  customJS?: string;
  fileName?: string;
  template?: string; // 'modern', 'dark', 'minimal', 'professional'
}

/**
 * Generate a complete standalone HTML file with the chart
 */
export function generateChartHTML(options: HTMLExportOptions = {}) {
  const { 
    chartType, 
    chartData, 
    chartConfig,
    chartMode,
    activeDatasetIndex,
    uniformityMode,
    legendFilter
  } = useChartStore.getState();

  // Generate custom labels and enhance chart config
  const customLabels = generateCustomLabelsFromConfig(chartConfig, chartData, legendFilter);
  const enhancedChartConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      customLabels: customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined
    }
  };

  const {
    title = "Chart Export",
    width = 800,
    height = 600,
    backgroundColor = "#ffffff",
    includeResponsive = true,
    includeAnimations = true,
    includeTooltips = true,
    includeLegend = true,
    customCSS = "",
    customJS = "",
    fileName = `chart-${new Date().toISOString().slice(0, 10)}.html`,
    template = "modern"
  } = options;

  // Use template if specified
  if (template && htmlTemplates[template as keyof typeof htmlTemplates]) {
    const selectedTemplate = htmlTemplates[template as keyof typeof htmlTemplates];
    const htmlContent = selectedTemplate.generate(chartData, enhancedChartConfig, chartType, options);
    return {
      content: htmlContent,
      fileName,
      size: new Blob([htmlContent]).size
    };
  }

  // Get Chart.js CDN version (using latest stable)
  const chartJsVersion = "4.4.1";
  const reactChartJsVersion = "5.2.0";

  // Generate the complete HTML structure
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@${chartJsVersion}/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${generateCompletePluginSystem(enhancedChartConfig)}
    </script>
    
    <!-- Custom Styles -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: ${backgroundColor};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .chart-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 100%;
            overflow: hidden;
        }
        
        .chart-title {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
            font-size: 24px;
            font-weight: 600;
        }
        
        .chart-wrapper {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            max-width: 100%;
            margin: 0 auto;
        }
        
        .chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .chart-info {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
            color: #666;
        }
        
        .chart-info h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .chart-info ul {
            list-style: none;
            padding-left: 0;
        }
        
        .chart-info li {
            margin-bottom: 5px;
            padding-left: 15px;
            position: relative;
        }
        
        .chart-info li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #007bff;
        }
        
        @media (max-width: 768px) {
            .chart-container {
                padding: 15px;
            }
            
            .chart-wrapper {
                width: 100%;
                height: 400px;
            }
            
            .chart-title {
                font-size: 20px;
            }
        }
        
        ${customCSS}
    </style>
</head>
<body>
    <div class="chart-container">
        <h1 class="chart-title">${title}</h1>
        
        <div class="chart-wrapper">
            <canvas id="chartCanvas" class="chart-canvas"></canvas>
        </div>
        
        <div class="chart-info">
            <h3>Chart Information</h3>
            <ul>
                <li><strong>Type:</strong> ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</li>
                <li><strong>Data Points:</strong> ${chartData.labels?.length || 0}</li>
                <li><strong>Datasets:</strong> ${chartData.datasets.length}</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Dimensions:</strong> ${width} × ${height}px</li>
            </ul>
        </div>
    </div>

    <script>
        // Chart.js Configuration
        const chartConfig = ${JSON.stringify(enhancedChartConfig, null, 8)};
        const chartData = ${JSON.stringify(chartData, null, 8)};
        const chartType = "${chartType}";
        
        // Enhanced configuration for standalone HTML
        const enhancedConfig = {
            ...chartConfig,
            responsive: ${includeResponsive},
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 1000,
                easing: 'easeInOutQuart'
            } : false,
            plugins: {
                ...chartConfig.plugins,
                tooltip: ${includeTooltips} ? {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    padding: 12
                } : { enabled: false },
                legend: ${includeLegend} ? {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                } : { display: false }
            }
        };
        
        // Initialize chart when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            // Create the chart
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig
            });
            
            // Add custom JavaScript if provided
            ${customJS}
            
            // Add some interactive features
            chart.canvas.addEventListener('click', function(event) {
                const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const firstPoint = points[0];
                    const label = chart.data.labels[firstPoint.index];
                    const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                    console.log('Clicked on:', label, 'Value:', value);
                }
            });
            
            // Add keyboard navigation
            document.addEventListener('keydown', function(event) {
                switch(event.key) {
                    case 'r':
                    case 'R':
                        chart.resetZoom();
                        break;
                    case 'f':
                    case 'F':
                        chart.fit();
                        break;
                }
            });
            
            // Make chart globally accessible for debugging
            window.chart = chart;
            
            console.log('Chart initialized successfully!');
            console.log('Chart type:', chartType);
            console.log('Data points:', chartData.labels?.length || 0);
            console.log('Datasets:', chartData.datasets.length);
        });
        
        // Error handling
        window.addEventListener('error', function(event) {
            console.error('Chart error:', event.error);
            document.querySelector('.chart-container').innerHTML = 
                '<div style="text-align: center; padding: 50px; color: #666;">' +
                '<h3>Error Loading Chart</h3>' +
                '<p>There was an error loading the chart. Please check the console for details.</p>' +
                '</div>';
        });
    </script>
</body>
</html>`;

  return {
    content: htmlContent,
    fileName: fileName,
    size: new Blob([htmlContent]).size
  };
}

/**
 * Download the generated HTML file
 */
export function downloadChartAsHTML(options: HTMLExportOptions = {}) {
  try {
    const { content, fileName, size } = generateChartHTML(options);
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`HTML chart exported successfully! File: ${fileName}, Size: ${(size / 1024).toFixed(2)} KB`);
    
    return {
      success: true,
      fileName,
      size,
      message: `Chart exported as HTML (${(size / 1024).toFixed(2)} KB)`
    };
  } catch (error) {
    console.error('Error exporting chart as HTML:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export chart as HTML'
    };
  }
}

/**
 * Generate HTML with custom template
 */
export function generateCustomChartHTML(template: string, options: HTMLExportOptions = {}) {
  const { chartType, chartData, chartConfig, chartMode, activeDatasetIndex, uniformityMode, legendFilter } = useChartStore.getState();
  const customLabels = generateCustomLabelsFromConfig(chartConfig, chartData, legendFilter);
  const enhancedChartConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      customLabels: customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined
    }
  };
  
  // Replace placeholders in template
  const htmlContent = template
    .replace(/\{\{chartType\}\}/g, chartType)
    .replace(/\{\{chartData\}\}/g, JSON.stringify(chartData, null, 2))
    .replace(/\{\{chartConfig\}\}/g, JSON.stringify(enhancedChartConfig, null, 2))
    .replace(/\{\{title\}\}/g, options.title || 'Chart Export')
    .replace(/\{\{width\}\}/g, String(options.width || 800))
    .replace(/\{\{height\}\}/g, String(options.height || 600))
    .replace(/\{\{backgroundColor\}\}/g, options.backgroundColor || '#ffffff')
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
  
  return {
    content: htmlContent,
    fileName: options.fileName || `custom-chart-${new Date().toISOString().slice(0, 10)}.html`,
    size: new Blob([htmlContent]).size
  };
}

/**
 * Generate minimal HTML (just the chart without extra styling)
 */
export function generateMinimalChartHTML(options: HTMLExportOptions = {}) {
  const { chartType, chartData, chartConfig, chartMode, activeDatasetIndex, uniformityMode, legendFilter } = useChartStore.getState();
  const customLabels = generateCustomLabelsFromConfig(chartConfig, chartData, legendFilter);
  const enhancedChartConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      customLabels: customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined
    }
  };
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${options.title || 'Chart'}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
</head>
<body>
    <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
            type: '${chartType}',
            data: ${JSON.stringify(chartData)},
            options: ${JSON.stringify(enhancedChartConfig)}
        });
    </script>
</body>
</html>`;
  
  return {
    content: htmlContent,
    fileName: options.fileName || `minimal-chart-${new Date().toISOString().slice(0, 10)}.html`,
    size: new Blob([htmlContent]).size
  };
}

/**
 * Generate HTML with embedded data (no external dependencies)
 */
export function generateEmbeddedChartHTML(options: HTMLExportOptions = {}) {
  const { chartType, chartData, chartConfig } = useChartStore.getState();
  
  // This would require embedding the entire Chart.js library
  // For now, we'll use CDN but with fallback
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Embedded Chart'}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .chart-container { max-width: 100%; overflow: hidden; }
        canvas { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="chart-container">
        <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
    </div>
    
    <script>
        // Try to load Chart.js from CDN, with fallback
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
            document.body.innerHTML = '<p>Error: Could not load Chart.js library</p>';
        });
    </script>
</body>
</html>`;
  
  return {
    content: htmlContent,
    fileName: options.fileName || `embedded-chart-${new Date().toISOString().slice(0, 10)}.html`,
    size: new Blob([htmlContent]).size
  };
} 