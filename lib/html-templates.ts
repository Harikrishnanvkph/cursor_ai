import { type HTMLExportOptions } from "./html-exporter";
import { generateCompletePluginSystem } from "./html-plugins";

/**
 * Generate legend config with generateLabels function for HTML export
 */
function generateLegendConfigWithGenerateLabels(legendConfig: any): string {
  const legendType = legendConfig.legendType || 'dataset';
  const legendLabelsConfig = legendConfig.labels || {};
  
  return `{
    ...${JSON.stringify(legendConfig, null, 20)},
      labels: {
      ...${JSON.stringify(legendLabelsConfig, null, 20)},
      generateLabels: function(chart) {
        const usePointStyle = ${JSON.stringify(legendLabelsConfig.usePointStyle || false)};
        const pointStyle = ${JSON.stringify(legendLabelsConfig.pointStyle || 'rect')};
        const fontColor = ${JSON.stringify(legendLabelsConfig.font?.color || legendLabelsConfig.color || '#000000')};
        
        const createItem = (props, isHidden) => {
          const baseItem = {
            ...props,
            pointStyle: usePointStyle ? pointStyle : undefined,
            fontColor: isHidden ? '#999' : fontColor,
            hidden: isHidden
          };
          
          // Add clean strikethrough indicator when hidden
          if (isHidden && baseItem.text) {
            baseItem.text = '' + baseItem.text;
          }
          
          return baseItem;
        };
        
        const items = [];
        const labels = chart.data.labels || [];
        const datasets = chart.data.datasets || [];
        
        if (${JSON.stringify(legendType)} === 'slice' || ${JSON.stringify(legendType)} === 'both') {
          for (let i = 0; i < labels.length; ++i) {
            const dataset = datasets[0];
            if (dataset) {
              // Check if this slice is hidden
              const isHidden = typeof chart.getDataVisibility === 'function' 
                ? !chart.getDataVisibility(i) 
                : false;
              
              const backgroundColor = Array.isArray(dataset.backgroundColor) 
                ? dataset.backgroundColor[i] 
                : dataset.backgroundColor || '#ccc';
              const borderColor = Array.isArray(dataset.borderColor) 
                ? dataset.borderColor[i] 
                : dataset.borderColor || '#333';
              items.push(createItem({
                text: String(labels[i]),
                fillStyle: backgroundColor,
                strokeStyle: borderColor,
                index: i,
                datasetIndex: 0,
                type: 'slice',
              }, isHidden));
            }
          }
        }
        if (${JSON.stringify(legendType)} === 'dataset' || ${JSON.stringify(legendType)} === 'both') {
          for (let i = 0; i < datasets.length; ++i) {
            // Check if this dataset is hidden
            const isHidden = typeof chart.isDatasetVisible === 'function' 
              ? !chart.isDatasetVisible(i) 
              : false;
            
            const dataset = datasets[i];
            const backgroundColor = Array.isArray(dataset.backgroundColor) 
              ? dataset.backgroundColor[0] 
              : dataset.backgroundColor || '#ccc';
            const borderColor = Array.isArray(dataset.borderColor) 
              ? dataset.borderColor[0] 
              : dataset.borderColor || '#333';
            items.push(createItem({
              text: dataset.label || \`Dataset \${i + 1}\`,
              fillStyle: backgroundColor,
              strokeStyle: borderColor,
              datasetIndex: i,
              index: i,
              type: 'dataset',
            }, isHidden));
          }
        }
        return items;
      }
    }
  }`;
}

export interface HTMLTemplate {
  name: string;
  description: string;
  generate: (chartData: any, chartConfig: any, chartType: string, options: HTMLExportOptions) => string;
}

/**
 * Modern responsive template with clean design
 */
function resolveLegendConfig(
  options: HTMLExportOptions,
  fallback: () => Record<string, any>
) {
  if (options.legendConfigOverride) {
    return options.legendConfigOverride;
  }
  if (options.includeLegend === false) {
    return { display: false };
  }
  return fallback();
}

/**
 * Helper function to generate chart initialization script
 */
function generateChartScript(chartData: any, chartConfig: any, chartType: string, options: HTMLExportOptions, legendConfig: any): string {
  const { includeAnimations, includeTooltips, includeLegend } = options;
  
  return `
        // Chart Configuration
        const chartConfig = ${JSON.stringify(chartConfig, null, 8)};
        const chartData = ${JSON.stringify(chartData, null, 8)};
        const chartType = "${chartType}";
        
        const enhancedConfig = {
            ...chartConfig,
            responsive: false,
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 800,
                easing: 'easeInOutQuart'
            } : false,
            plugins: {
                ...chartConfig.plugins,
                tooltip: ${includeTooltips} ? {
                    enabled: true
                } : { enabled: false },
                legend: ${includeLegend ? generateLegendConfigWithGenerateLabels(legendConfig) : '{ display: false }'}
            }
        };
        
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig
            });
            window.chart = chart;
        });
        
        window.addEventListener('error', function(event) {
            console.error('Chart error:', event.error);
        });
    `;
}

/**
 * Plain template - minimal HTML with just the chart and required scripts
 */
export const plainTemplate: HTMLTemplate = {
  name: "Plain",
  description: "Bare HTML page with only the chart and no extra layout or styling",
  generate: (chartData, chartConfig, chartType, options) => {
    const { title, width, height, backgroundColor, includeAnimations, includeTooltips, includeLegend } = options;
    const legendConfig = resolveLegendConfig(options, () => ({
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 10,
        font: { size: 12, weight: '500' },
        color: '#000000'
      }
    }));
    
    // Get background configuration from chartConfig
    const background = (chartConfig as any)?.background || { type: 'color', color: '#ffffff' };
    let backgroundLayerHTML = '';
    let chartContainerStyle = '';
    
    if (background.type === "image" && background.imageUrl) {
      const opacity = background.opacity || 100;
      const imageFit = background.imageFit || 'cover';
      const backgroundSize = imageFit === 'fill' ? '100% 100%' : 
                            imageFit === 'contain' ? 'contain' : 'cover';
      // Use the imageUrl directly without JSON.stringify to avoid double-quoting data URLs
      const imageUrl = background.imageUrl.startsWith('data:') 
        ? background.imageUrl 
        : JSON.stringify(background.imageUrl);
      backgroundLayerHTML = `<div class="chart-background" style="position: absolute; inset: 0; z-index: 0; background-image: url(${imageUrl}); background-size: ${backgroundSize}; background-position: center; background-repeat: no-repeat; opacity: ${opacity / 100}; pointer-events: none;"></div>`;
    } else if (background.type === "gradient") {
      const color1 = background.gradientColor1 || '#ffffff';
      const color2 = background.gradientColor2 || '#000000';
      const opacity = background.opacity || 100;
      const gradientType = background.gradientType || 'linear';
      const direction = background.gradientDirection || 'to right';
      let gradient;
      if (gradientType === 'radial') {
        gradient = `radial-gradient(circle, ${color1}, ${color2})`;
      } else {
        gradient = `linear-gradient(${direction}, ${color1}, ${color2})`;
      }
      backgroundLayerHTML = `<div class="chart-background" style="position: absolute; inset: 0; z-index: 0; background-image: ${gradient}; opacity: ${opacity / 100}; pointer-events: none;"></div>`;
    } else if (background.type === "color" || background.type === undefined) {
      const color = background.color || "#ffffff";
      const opacity = background.opacity || 100;
      // Convert hex color to rgba if opacity is not 100%
      if (opacity < 100 && color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const alpha = opacity / 100;
        chartContainerStyle = `background-color: rgba(${r}, ${g}, ${b}, ${alpha});`;
      } else {
        chartContainerStyle = `background-color: ${color};`;
      }
    } else if (background.type === "transparent") {
      chartContainerStyle = `background-color: transparent;`;
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    <script>
        ${generateCompletePluginSystem(chartConfig)}
    </script>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .chart-container {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            ${chartContainerStyle}
        }
        .chart-wrapper {
            position: absolute;
            inset: 0;
            z-index: 1;
            width: 100%;
            height: 100%;
            background: transparent;
        }
        #chartCanvas {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        ${backgroundLayerHTML}
        <div class="chart-wrapper">
            <canvas id="chartCanvas" width="${width}" height="${height}"></canvas>
        </div>
    </div>
    <script>${generateChartScript(chartData, chartConfig, chartType, options, legendConfig)}</script>
</body>
</html>`;
  }
};


// Export all templates
export const htmlTemplates = {
  plain: plainTemplate
};

export const templateList = Object.entries(htmlTemplates).map(([key, template]) => ({
  id: key,
  name: template.name,
  description: template.description
})); 
