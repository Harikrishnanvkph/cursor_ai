import { useChartStore } from "./chart-store";
import { type ExtendedChartData, type SupportedChartType } from "./chart-store";
import { chartTypeMapping } from "./chart-store";
import { htmlTemplates, type HTMLTemplate } from "./html-templates";
import { generateCompletePluginSystem } from "./html-plugins";
import { getCurrentDragState } from "./custom-label-plugin";

// Function to convert image URL to base64
async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    // Handle data URLs (already base64)
    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Handle blob URLs
    if (imageUrl.startsWith('blob:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Handle external URLs
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Handle relative URLs (try to fetch from current domain)
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64:', imageUrl, error);
    return imageUrl; // Return original URL as fallback
  }
}

// Function to process chart data and convert images to base64
async function processChartDataForExport(chartData: ExtendedChartData): Promise<ExtendedChartData> {
  const processedData = { ...chartData };
  
  // Process datasets for images
  if (processedData.datasets) {
    for (const dataset of processedData.datasets) {
      if (dataset.pointImages && dataset.pointImages.length > 0) {
        const processedImages = await Promise.all(
          dataset.pointImages.map(async (imageUrl) => {
            if (imageUrl) {
              return await convertImageToBase64(imageUrl);
            }
            return null;
          })
        );
        dataset.pointImages = processedImages;
      }
    }
  }
  
  return processedData;
}

function buildLegendConfigForExport(chartConfig: any, includeLegend: boolean) {
  const legendConfig = chartConfig?.plugins?.legend ?? {};
  const labelsConfig = legendConfig.labels ?? {};
  const fontConfig = labelsConfig.font ?? {};
  const usePointStyle = labelsConfig.usePointStyle ?? true;
  const legendType = (chartConfig?.plugins as any)?.legendType || 'dataset';

  if (!includeLegend) {
    return { display: false, legendType };
  }

  return {
    ...legendConfig,
    display: true,
    position: legendConfig.position ?? 'top',
    labels: {
      ...labelsConfig,
      usePointStyle,
      pointStyle: labelsConfig.pointStyle ?? (usePointStyle ? 'circle' : undefined),
      padding: labelsConfig.padding ?? 20,
      font: {
        ...fontConfig,
        size: fontConfig.size ?? 12,
      },
    },
    legendType, // Preserve legendType for generateLabels function
  };
}

// Shared function to generate custom labels
function generateCustomLabelsFromConfig(chartConfig: any, chartData: any, legendFilter: any, dragState: any = {}) {
  const customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};
  
  if (customLabelsConfig.display === false) {
    return [];
  }

  // Filter datasets based on legend filter
  const filteredDatasets = chartData.datasets.filter((_: any, index: number) => 
    legendFilter.datasets[index] !== false
  );

  return filteredDatasets.map((ds: any, datasetIdx: number) =>
    ds.data.map((value: any, pointIdx: number) => {
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
      
      // Check if this label has a stored drag position
      const dragKey = `${datasetIdx}_${pointIdx}`;
      const storedPosition = dragState[dragKey];
      
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
        // Include stored position if available
        x: storedPosition?.x,
        y: storedPosition?.y,
      };
    })
  );
}

// Sync image positions from drag state into chart data before export
function syncImagePositionsToConfig(chartData: any, dragState: any) {
  if (!dragState) return;
  chartData.datasets.forEach((dataset: any, datasetIdx: number) => {
    if (!dataset.pointImageConfig) return;
    dataset.pointImageConfig.forEach((config: any, pointIdx: number) => {
      const key = `${datasetIdx}_${pointIdx}`;
      if (dragState[key]) {
        config.calloutX = dragState[key].x;
        config.calloutY = dragState[key].y;
      }
    });
  });
}

export interface HTMLExportOptions {
  title?: string;
  subtitle?: string;
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
  dragState?: any; // Current drag state for custom labels
  legendConfigOverride?: any;
  // Runtime toggles from editor
  showImages?: boolean;
  showLabels?: boolean;
  fillArea?: boolean;
  showBorder?: boolean;
}

/**
 * Generate a complete standalone HTML file with the chart
 */
export async function generateChartHTML(options: HTMLExportOptions = {}) {
  const { 
    chartType, 
    chartData, 
    chartConfig,
    chartMode,
    activeDatasetIndex,
    uniformityMode,
    legendFilter
  } = useChartStore.getState();

  // Map custom chart types to actual Chart.js types
  const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;

  // Use provided drag state or try to capture current drag state from any active chart instance
  let currentDragState = options.dragState || {};
  if (!currentDragState || Object.keys(currentDragState).length === 0) {
    try {
      // Look for any chart instance in the DOM that might have drag state
      const canvasElements = document.querySelectorAll('canvas');
      for (const canvas of canvasElements) {
        const chartInstance = (canvas as any).chart;
        if (chartInstance) {
          const dragState = getCurrentDragState(chartInstance);
          if (Object.keys(dragState).length > 0) {
            currentDragState = dragState;
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Could not capture drag state for HTML export:', error);
    }
  }

  // Deep copy chart data to avoid mutating state
  const chartDataCopy = JSON.parse(JSON.stringify(chartData));
  // Sync image positions
  syncImagePositionsToConfig(chartDataCopy, currentDragState);

  // Process chart data to convert images to base64
  const processedChartData = await processChartDataForExport(chartDataCopy);

  // If Image toggle is off, strip dataset/slice images so export shows none
  if (options.showImages === false && Array.isArray(processedChartData.datasets)) {
    processedChartData.datasets = processedChartData.datasets.map((ds: any) => ({
      ...ds,
      pointImages: Array.isArray(ds.pointImages) ? ds.pointImages.map(() => null) : ds.pointImages
    }));
  }

  // Apply Fill Area and Show Border directly to the exported data (chartData) because
  // the Chart initialization uses this 'chartData' object, not options.data
  if ((options.fillArea !== undefined || options.showBorder !== undefined) && Array.isArray(processedChartData.datasets)) {
    processedChartData.datasets = processedChartData.datasets.map((ds: any) => {
      const out = { ...ds } as any;
      if (options.fillArea !== undefined) {
        const isLineLike = (chartType === 'line' || chartType === 'area' || chartType === 'radar');
        if (isLineLike) {
          out.fill = !!options.fillArea;
        }
        if (options.fillArea === false) {
          if (Array.isArray(out.backgroundColor)) out.backgroundColor = out.backgroundColor.map(() => 'transparent');
          else out.backgroundColor = 'transparent';
        }
      }
      if (options.showBorder !== undefined) {
        const bw = options.showBorder ? (typeof out.borderWidth === 'number' ? out.borderWidth || 2 : 2) : 0;
        out.borderWidth = bw;
        if (bw === 0) {
          if (Array.isArray(out.borderColor)) out.borderColor = out.borderColor.map(() => 'transparent');
          else out.borderColor = 'transparent';
        }
      }
      return out;
    });
  }

  // Get overlay data from chart store
  const { overlayImages, overlayTexts } = useChartStore.getState();
  
  // Process overlay images to convert URLs to base64
  const processedOverlayImages = await Promise.all(
    overlayImages.map(async (image) => ({
      ...image,
      url: await convertImageToBase64(image.url)
    }))
  );
  
  // Generate custom labels and enhance chart config
  // Apply runtime toggles: hide labels/images if disabled
  const effectiveConfig = JSON.parse(JSON.stringify(chartConfig));
  if (options.showLabels === false) {
    if (effectiveConfig.plugins?.customLabelsConfig) {
      effectiveConfig.plugins.customLabelsConfig.display = false;
    }
  }
  const customLabels = generateCustomLabelsFromConfig(effectiveConfig, processedChartData, legendFilter, currentDragState);
  
  // Process background image URL to base64 if needed
  const processedChartConfig = JSON.parse(JSON.stringify(chartConfig));
  if (processedChartConfig.background?.type === 'image' && processedChartConfig.background?.imageUrl) {
    processedChartConfig.background.imageUrl = await convertImageToBase64(processedChartConfig.background.imageUrl);
  }
  
  const enhancedChartConfig = {
    ...processedChartConfig,
    data: processedChartData, // required for plugins code generation
    plugins: {
      ...processedChartConfig.plugins,
      customLabels: (options.showLabels === false) ? undefined : (customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined),
      overlayPlugin: (options.showImages === false) ? undefined : {
        overlayImages: processedOverlayImages,
        overlayTexts: overlayTexts
      }
    }
  };

  const {
    title = chartConfig?.plugins?.title?.text || "Chart Export",
    subtitle = (chartConfig?.plugins?.subtitle?.display && chartConfig?.plugins?.subtitle?.text) 
      ? chartConfig.plugins.subtitle.text 
      : undefined,
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
    template = "plain"
  } = options;

  const legendForExport = buildLegendConfigForExport(enhancedChartConfig, includeLegend);

  const optionsWithLegend = {
    ...options,
    legendConfigOverride: legendForExport
  };

  // Use template if specified
  if (template && htmlTemplates[template as keyof typeof htmlTemplates]) {
    const selectedTemplate = htmlTemplates[template as keyof typeof htmlTemplates];
    const htmlContent = selectedTemplate.generate(processedChartData, enhancedChartConfig, mappedChartType, optionsWithLegend);
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
                <li><strong>Data Points:</strong> ${processedChartData.labels?.length || 0}</li>
                <li><strong>Datasets:</strong> ${processedChartData.datasets.length}</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Dimensions:</strong> ${width} × ${height}px</li>
            </ul>
        </div>
    </div>

    <script>
        // Chart.js Configuration
        const chartConfig = ${JSON.stringify(enhancedChartConfig, null, 8)};
        const chartData = ${JSON.stringify(processedChartData, null, 8)};
        const chartType = "${mappedChartType}";
        
        // Extract legendType for generateLabels function
        const legendType = ${JSON.stringify(legendForExport.legendType || 'dataset')};
        const legendLabelsConfig = ${JSON.stringify(legendForExport.labels || {})};
        
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
                legend: {
                    ...${JSON.stringify(legendForExport, null, 8)},
                    labels: {
                        ...legendLabelsConfig,
                        generateLabels: function(chart) {
                            const usePointStyle = legendLabelsConfig.usePointStyle || false;
                            const pointStyle = legendLabelsConfig.pointStyle || 'rect';
                            const fontColor = legendLabelsConfig.font?.color || legendLabelsConfig.color || '#000000';
                            
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
                            
                            if (legendType === 'slice' || legendType === 'both') {
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
                            if (legendType === 'dataset' || legendType === 'both') {
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
                }
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
    fileName,
    size: new Blob([htmlContent]).size
  };
}

/**
 * Download the generated HTML file
 */
export async function downloadChartAsHTML(options: HTMLExportOptions = {}) {
  try {
    const { content, fileName, size } = await generateChartHTML(options);
    
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
  } catch (error: any) {
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
export async function generateCustomChartHTML(template: string, options: HTMLExportOptions = {}) {
  const { chartType, chartData, chartConfig, chartMode, activeDatasetIndex, uniformityMode, legendFilter } = useChartStore.getState();
  
  // Map custom chart types to actual Chart.js types
  const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
  
  // Process chart data to convert images to base64
  const processedChartData = await processChartDataForExport(chartData);
  
  const effectiveConfig2 = JSON.parse(JSON.stringify(chartConfig));
  if (options.showLabels === false && effectiveConfig2.plugins?.customLabelsConfig) {
    effectiveConfig2.plugins.customLabelsConfig.display = false;
  }
  const customLabels = generateCustomLabelsFromConfig(effectiveConfig2, processedChartData, legendFilter, options.dragState);
  const enhancedChartConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      customLabels: (options.showLabels === false) ? undefined : (customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined)
    }
  };
  
  // Replace placeholders in template
  const htmlContent = template
    .replace(/\{\{chartType\}\}/g, mappedChartType)
    .replace(/\{\{chartData\}\}/g, JSON.stringify(processedChartData, null, 2))
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
  
  // Map custom chart types to actual Chart.js types
  const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
  
  const customLabels = generateCustomLabelsFromConfig(chartConfig, chartData, legendFilter, options.dragState);
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
            type: '${mappedChartType}',
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
  
  // Map custom chart types to actual Chart.js types
  const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
  
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
                type: '${mappedChartType}',
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

/**
 * Generate chart HTML content specifically for embedding in templates
 * This function extracts just the chart-related HTML without the full page structure
 */
export async function generateChartHTMLForTemplate(options: HTMLExportOptions = {}): Promise<{
  chartScript: string
  chartStyles: string
  pluginsScript: string
  chartContainer: string
}> {
  const { 
    chartType, 
    chartData, 
    chartConfig,
    chartMode,
    activeDatasetIndex,
    uniformityMode,
    legendFilter
  } = useChartStore.getState();
  
  // Map custom chart types to actual Chart.js types
  const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
  const storeToggles = useChartStore.getState();
  const effectiveShowImages = options.showImages ?? (storeToggles as any).showImages ?? true;
  const effectiveShowLabels = options.showLabels ?? (storeToggles as any).showLabels ?? true;
  const effectiveFillArea = options.fillArea ?? (storeToggles as any).fillArea;
  const effectiveShowBorder = options.showBorder ?? (storeToggles as any).showBorder;

  // Use provided drag state or try to capture current drag state from any active chart instance
  let currentDragState = options.dragState || {};
  if (!currentDragState || Object.keys(currentDragState).length === 0) {
    try {
      // Look for any chart instance in the DOM that might have drag state
      const canvasElements = document.querySelectorAll('canvas');
      for (const canvas of canvasElements) {
        const chartInstance = (canvas as any).chart;
        if (chartInstance) {
          const dragState = getCurrentDragState(chartInstance);
          if (Object.keys(dragState).length > 0) {
            currentDragState = dragState;
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Could not capture drag state for HTML export:', error);
    }
  }

  // Deep copy chart data to avoid mutating state
  const chartDataCopy = JSON.parse(JSON.stringify(chartData));
  // Sync image positions
  syncImagePositionsToConfig(chartDataCopy, currentDragState);

  // Process chart data to convert images to base64
  const processedChartData = await processChartDataForExport(chartDataCopy);

  // Respect toggles for images/labels/fill/border in template exports
  if (effectiveShowImages === false && Array.isArray(processedChartData.datasets)) {
    processedChartData.datasets = processedChartData.datasets.map((ds: any) => ({
      ...ds,
      pointImages: Array.isArray(ds.pointImages) ? ds.pointImages.map(() => null) : ds.pointImages
    }));
  }
  if ((effectiveFillArea !== undefined || effectiveShowBorder !== undefined) && Array.isArray(processedChartData.datasets)) {
    processedChartData.datasets = processedChartData.datasets.map((ds: any) => {
      const out = { ...ds } as any;
      if (effectiveFillArea !== undefined) {
        const isLineLike = (chartType === 'line' || chartType === 'area' || chartType === 'radar');
        if (isLineLike) out.fill = !!effectiveFillArea;
        if (effectiveFillArea === false) {
          if (Array.isArray(out.backgroundColor)) out.backgroundColor = out.backgroundColor.map(() => 'transparent');
          else out.backgroundColor = 'transparent';
        }
      }
      if (effectiveShowBorder !== undefined) {
        const bw = effectiveShowBorder ? (typeof out.borderWidth === 'number' ? out.borderWidth || 2 : 2) : 0;
        out.borderWidth = bw;
        if (bw === 0) {
          if (Array.isArray(out.borderColor)) out.borderColor = out.borderColor.map(() => 'transparent');
          else out.borderColor = 'transparent';
        }
      }
      return out;
    });
  }

  // Get overlay data from chart store
  const { overlayImages, overlayTexts } = useChartStore.getState();
  
  // Process overlay images to convert URLs to base64
  const processedOverlayImages = await Promise.all(
    overlayImages.map(async (image) => ({
      ...image,
      url: await convertImageToBase64(image.url)
    }))
  );
  
  // Generate custom labels and enhance chart config
  const effectiveConfig = JSON.parse(JSON.stringify(chartConfig));
  if (effectiveShowLabels === false) {
    if (effectiveConfig.plugins?.customLabelsConfig) {
      effectiveConfig.plugins.customLabelsConfig.display = false;
    }
  }
  const customLabels = generateCustomLabelsFromConfig(effectiveConfig, processedChartData, legendFilter, currentDragState);
  const enhancedChartConfig = {
    ...chartConfig,
    data: processedChartData,
    plugins: {
      ...chartConfig.plugins,
      customLabels: (effectiveShowLabels === false) ? undefined : (customLabels.length > 0 ? { 
        shapeSize: 32, 
        labels: customLabels 
      } : undefined),
      overlayPlugin: (effectiveShowImages === false) ? undefined : {
        overlayImages: processedOverlayImages,
        overlayTexts: overlayTexts
      }
    }
  };

  const {
    width = 800,
    height = 600,
    includeResponsive = true,
    includeAnimations = true,
    includeTooltips = true,
    includeLegend = true,
  } = options;

  const legendForExport = buildLegendConfigForExport(enhancedChartConfig, includeLegend);

  // Generate the chart script
  const chartScript = `
    // Chart.js Configuration
    const chartConfig = ${JSON.stringify(enhancedChartConfig, null, 8)};
    const chartData = ${JSON.stringify(processedChartData, null, 8)};
    const chartType = "${mappedChartType}";
    
    // Extract legendType for generateLabels function
    const legendType = ${JSON.stringify(legendForExport.legendType || 'slice')};
    const legendLabelsConfig = ${JSON.stringify(legendForExport.labels || {})};
    
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
            legend: {
                ...${JSON.stringify(legendForExport, null, 8)},
                labels: {
                    ...legendLabelsConfig,
                    generateLabels: function(chart) {
                        const usePointStyle = legendLabelsConfig.usePointStyle || false;
                        const pointStyle = legendLabelsConfig.pointStyle || 'rect';
                        const fontColor = legendLabelsConfig.font?.color || legendLabelsConfig.color || '#000000';
                        
                        const createItem = (props) => ({
                            ...props,
                            pointStyle: usePointStyle ? pointStyle : undefined,
                            fontColor: fontColor
                        });
                        
                        const items = [];
                        const labels = chart.data.labels || [];
                        const datasets = chart.data.datasets || [];
                        
                        if (legendType === 'slice' || legendType === 'both') {
                            for (let i = 0; i < labels.length; ++i) {
                                const dataset = datasets[0];
                                if (dataset) {
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
                                        hidden: false,
                                        index: i,
                                        datasetIndex: 0,
                                        type: 'slice',
                                    }));
                                }
                            }
                        }
                        if (legendType === 'dataset' || legendType === 'both') {
                            for (let i = 0; i < datasets.length; ++i) {
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
                                    hidden: false,
                                    datasetIndex: i,
                                    index: i,
                                    type: 'dataset',
                                }));
                            }
                        }
                        return items;
                    }
                }
            }
        }
    };
    
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: enhancedConfig
    });
  `;

  // Generate chart styles
  const chartStyles = `
    .chart-area {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        background: white;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .chart-canvas {
        width: ${width}px !important;
        height: ${height}px !important;
    }
  `;

  // Generate plugins script
  const pluginsScript = generateCompletePluginSystem(enhancedChartConfig);

  // Generate chart container
  const chartContainer = `
    <canvas id="chartCanvas" class="chart-canvas" width="${width}" height="${height}"></canvas>
  `;

  return {
    chartScript,
    chartStyles,
    pluginsScript,
    chartContainer
  };
} 