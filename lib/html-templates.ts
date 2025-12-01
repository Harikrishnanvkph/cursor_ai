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
</head>
<body>
    <canvas id="chartCanvas" width="${width}" height="${height}"></canvas>
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
