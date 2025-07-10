import { type HTMLExportOptions } from "./html-exporter";
import { generateCompletePluginSystem } from "./html-plugins";

export interface HTMLTemplate {
  name: string;
  description: string;
  generate: (chartData: any, chartConfig: any, chartType: string, options: HTMLExportOptions) => string;
}

/**
 * Modern responsive template with clean design
 */
export const modernTemplate: HTMLTemplate = {
  name: "Modern Responsive",
  description: "Clean, modern design with responsive layout and smooth animations",
  generate: (chartData, chartConfig, chartType, options) => {
    const { title, width, height, backgroundColor, includeAnimations, includeTooltips, includeLegend } = options;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${generateCompletePluginSystem(chartConfig)}
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, ${backgroundColor} 0%, #f8f9fa 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 100%;
            width: ${width}px;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .title {
            text-align: center;
            margin-bottom: 30px;
            color: #2d3748;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .chart-wrapper {
            position: relative;
            height: ${height}px;
            margin: 0 auto;
            border-radius: 12px;
            overflow: hidden;
            background: #fafbfc;
            border: 1px solid #e2e8f0;
        }
        
        .chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .info-panel {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .info-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4a5568;
            font-size: 14px;
        }
        
        .info-value {
            font-weight: 600;
            color: #2d3748;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .badge-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            .title {
                font-size: 24px;
            }
            
            .chart-wrapper {
                height: 400px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 15px;
            }
            
            .title {
                font-size: 20px;
            }
            
            .chart-wrapper {
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">${title}</h1>
        
        <div class="chart-wrapper">
            <canvas id="chartCanvas" class="chart-canvas"></canvas>
        </div>
        
        <div class="info-panel">
            <div class="info-title">
                📊 Chart Information
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span>Type:</span>
                    <span class="info-value">${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</span>
                </div>
                <div class="info-item">
                    <span>Data Points:</span>
                    <span class="info-value">${chartData.labels?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span>Datasets:</span>
                    <span class="info-value">${chartData.datasets.length}</span>
                </div>
                <div class="info-item">
                    <span>Generated:</span>
                    <span class="info-value">${new Date().toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span>Dimensions:</span>
                    <span class="info-value">${width} × ${height}px</span>
                </div>
                <div class="info-item">
                    <span>Features:</span>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${includeAnimations ? '<span class="badge badge-primary">Animations</span>' : ''}
                        ${includeTooltips ? '<span class="badge badge-secondary">Tooltips</span>' : ''}
                        ${includeLegend ? '<span class="badge badge-secondary">Legend</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Chart Configuration
        const chartConfig = ${JSON.stringify(chartConfig, null, 8)};
        const chartData = ${JSON.stringify(chartData, null, 8)};
        const chartType = "${chartType}";
        
        // Enhanced configuration
        const enhancedConfig = {
            ...chartConfig,
            responsive: true,
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 1500,
                easing: 'easeInOutQuart',
                onProgress: function(animation) {
                    const progress = animation.currentStep / animation.numSteps;
                    // Add subtle animation effects
                }
            } : false,
            plugins: {
                ...chartConfig.plugins,
                tooltip: ${includeTooltips} ? {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    padding: 16,
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 13 }
                } : { enabled: false },
                legend: ${includeLegend} ? {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '500' },
                        color: '#4a5568'
                    }
                } : { display: false }
            }
        };
        
        // Initialize chart
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig
            });
            
            // Add interactive features
            chart.canvas.addEventListener('click', function(event) {
                const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const firstPoint = points[0];
                    const label = chart.data.labels[firstPoint.index];
                    const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                    console.log('Clicked on:', label, 'Value:', value);
                }
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', function(event) {
                switch(event.key) {
                    case 'r':
                    case 'R':
                        if (chart.resetZoom) chart.resetZoom();
                        break;
                    case 'f':
                    case 'F':
                        if (chart.fit) chart.fit();
                        break;
                }
            });
            
            // Make chart globally accessible
            window.chart = chart;
            
            console.log('Chart initialized successfully!');
        });
        
        // Error handling
        window.addEventListener('error', function(event) {
            console.error('Chart error:', event.error);
            document.querySelector('.container').innerHTML = 
                '<div style="text-align: center; padding: 50px; color: #666;">' +
                '<h3>❌ Error Loading Chart</h3>' +
                '<p>There was an error loading the chart. Please check the console for details.</p>' +
                '</div>';
        });
    </script>
</body>
</html>`;
  }
};

/**
 * Dark theme template
 */
export const darkTemplate: HTMLTemplate = {
  name: "Dark Theme",
  description: "Modern dark theme with neon accents and sleek design",
  generate: (chartData, chartConfig, chartType, options) => {
    const { title, width, height, includeAnimations, includeTooltips, includeLegend } = options;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${generateCompletePluginSystem(chartConfig)}
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #e2e8f0;
        }
        
        .container {
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            max-width: 100%;
            width: ${width}px;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00d4ff, #ff00ff, #00ff88);
            animation: glow 3s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { opacity: 0.7; }
            to { opacity: 1; }
        }
        
        .title {
            text-align: center;
            margin-bottom: 30px;
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }
        
        .chart-wrapper {
            position: relative;
            height: ${height}px;
            margin: 0 auto;
            border-radius: 16px;
            overflow: hidden;
            background: rgba(15, 15, 35, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .chart-canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .info-panel {
            margin-top: 30px;
            padding: 20px;
            background: rgba(15, 15, 35, 0.4);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .info-title {
            font-size: 18px;
            font-weight: 600;
            color: #00d4ff;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0aec0;
            font-size: 14px;
        }
        
        .info-value {
            font-weight: 600;
            color: #ffffff;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-primary {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: #000;
        }
        
        .badge-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            .title {
                font-size: 24px;
            }
            
            .chart-wrapper {
                height: 400px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">${title}</h1>
        
        <div class="chart-wrapper">
            <canvas id="chartCanvas" class="chart-canvas"></canvas>
        </div>
        
        <div class="info-panel">
            <div class="info-title">
                🌟 Chart Information
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span>Type:</span>
                    <span class="info-value">${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</span>
                </div>
                <div class="info-item">
                    <span>Data Points:</span>
                    <span class="info-value">${chartData.labels?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span>Datasets:</span>
                    <span class="info-value">${chartData.datasets.length}</span>
                </div>
                <div class="info-item">
                    <span>Generated:</span>
                    <span class="info-value">${new Date().toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span>Dimensions:</span>
                    <span class="info-value">${width} × ${height}px</span>
                </div>
                <div class="info-item">
                    <span>Features:</span>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${includeAnimations ? '<span class="badge badge-primary">Animations</span>' : ''}
                        ${includeTooltips ? '<span class="badge badge-secondary">Tooltips</span>' : ''}
                        ${includeLegend ? '<span class="badge badge-secondary">Legend</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Chart Configuration
        const chartConfig = ${JSON.stringify(chartConfig, null, 8)};
        const chartData = ${JSON.stringify(chartData, null, 8)};
        const chartType = "${chartType}";
        
        // Dark theme enhanced configuration
        const enhancedConfig = {
            ...chartConfig,
            responsive: true,
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 2000,
                easing: 'easeInOutQuart'
            } : false,
            plugins: {
                ...chartConfig.plugins,
                tooltip: ${includeTooltips} ? {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#00d4ff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d4ff',
                    borderWidth: 2,
                    cornerRadius: 12,
                    displayColors: true,
                    padding: 16
                } : { enabled: false },
                legend: ${includeLegend} ? {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '500' },
                        color: '#e2e8f0'
                    }
                } : { display: false }
            }
        };
        
        // Initialize chart
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig
            });
            
            // Add interactive features
            chart.canvas.addEventListener('click', function(event) {
                const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const firstPoint = points[0];
                    const label = chart.data.labels[firstPoint.index];
                    const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                    console.log('Clicked on:', label, 'Value:', value);
                }
            });
            
            // Make chart globally accessible
            window.chart = chart;
            
            console.log('Dark theme chart initialized successfully!');
        });
        
        // Error handling
        window.addEventListener('error', function(event) {
            console.error('Chart error:', event.error);
            document.querySelector('.container').innerHTML = 
                '<div style="text-align: center; padding: 50px; color: #a0aec0;">' +
                '<h3>❌ Error Loading Chart</h3>' +
                '<p>There was an error loading the chart. Please check the console for details.</p>' +
                '</div>';
        });
    </script>
</body>
</html>`;
  }
};

/**
 * Minimal template for simple exports
 */
export const minimalTemplate: HTMLTemplate = {
  name: "Minimal",
  description: "Simple, clean template with minimal styling",
  generate: (chartData, chartConfig, chartType, options) => {
    const { title, width, height, includeAnimations, includeTooltips, includeLegend } = options;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${generateCompletePluginSystem(chartConfig)}
    </script>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            max-width: ${width}px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
        }
        
        .chart-container {
            width: 100%;
            height: ${height}px;
            margin: 20px 0;
        }
        
        canvas {
            max-width: 100%;
            height: auto;
        }
        
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        
        <div class="chart-container">
            <canvas id="chartCanvas"></canvas>
        </div>
        
        <div class="info">
            <strong>Chart Type:</strong> ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart<br>
            <strong>Data Points:</strong> ${chartData.labels?.length || 0}<br>
            <strong>Datasets:</strong> ${chartData.datasets.length}<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
    </div>

    <script>
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        
        // Enhanced configuration for standalone HTML
        const enhancedConfig = {
            ...${JSON.stringify(chartConfig)},
            responsive: true,
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 1000,
                easing: 'easeInOutQuart'
            } : false,
            plugins: {
                ...${JSON.stringify(chartConfig)}.plugins,
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
        
        new Chart(ctx, {
            type: '${chartType}',
            data: ${JSON.stringify(chartData)},
            options: enhancedConfig
        });
    </script>
</body>
</html>`;
  }
};

/**
 * Professional template for business reports
 */
export const professionalTemplate: HTMLTemplate = {
  name: "Professional",
  description: "Business-ready template with corporate styling",
  generate: (chartData, chartConfig, chartType, options) => {
    const { title, width, height, includeAnimations, includeTooltips, includeLegend } = options;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
    
    <!-- Custom Plugins -->
    <script>
        ${generateCompletePluginSystem(chartConfig)}
    </script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px 0;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 300;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.8;
        }
        
        .content {
            max-width: ${width}px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .chart-section {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .chart-title {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .chart-container {
            height: ${height}px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .info-section {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 30px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .info-card {
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #3498db;
        }
        
        .info-card h3 {
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .info-card p {
            color: #666;
            font-size: 14px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
            margin-top: 40px;
        }
        
        @media (max-width: 768px) {
            .content {
                padding: 20px 10px;
            }
            
            .chart-container {
                height: 400px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">Professional Chart Report</div>
    </div>
    
    <div class="content">
        <div class="chart-section">
            <h2 class="chart-title">Data Visualization</h2>
            <div class="chart-container">
                <canvas id="chartCanvas"></canvas>
            </div>
        </div>
        
        <div class="info-section">
            <h2 class="chart-title">Report Summary</h2>
            <div class="info-grid">
                <div class="info-card">
                    <h3>Chart Type</h3>
                    <p>${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</p>
                </div>
                <div class="info-card">
                    <h3>Data Points</h3>
                    <p>${chartData.labels?.length || 0} total data points</p>
                </div>
                <div class="info-card">
                    <h3>Datasets</h3>
                    <p>${chartData.datasets.length} dataset${chartData.datasets.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="info-card">
                    <h3>Generated</h3>
                    <p>${new Date().toLocaleString()}</p>
                </div>
                <div class="info-card">
                    <h3>Dimensions</h3>
                    <p>${width} × ${height} pixels</p>
                </div>
                <div class="info-card">
                    <h3>Features</h3>
                    <p>${includeAnimations ? 'Animations, ' : ''}${includeTooltips ? 'Tooltips, ' : ''}${includeLegend ? 'Legend' : ''}</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by AIChartor | Professional Chart Export</p>
    </div>

    <script>
        // Chart Configuration
        const chartConfig = ${JSON.stringify(chartConfig, null, 8)};
        const chartData = ${JSON.stringify(chartData, null, 8)};
        const chartType = "${chartType}";
        
        // Professional configuration
        const enhancedConfig = {
            ...chartConfig,
            responsive: true,
            maintainAspectRatio: false,
            animation: ${includeAnimations} ? {
                duration: 1200,
                easing: 'easeInOutQuart'
            } : false,
            plugins: {
                ...chartConfig.plugins,
                tooltip: ${includeTooltips} ? {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3498db',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    padding: 12
                } : { enabled: false },
                legend: ${includeLegend} ? {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: '500' },
                        color: '#2c3e50'
                    }
                } : { display: false }
            }
        };
        
        // Initialize chart
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig
            });
            
            // Make chart globally accessible
            window.chart = chart;
            
            console.log('Professional chart report generated successfully!');
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
  }
};

// Export all templates
export const htmlTemplates = {
  modern: modernTemplate,
  dark: darkTemplate,
  minimal: minimalTemplate,
  professional: professionalTemplate
};

export const templateList = Object.entries(htmlTemplates).map(([key, template]) => ({
  id: key,
  name: template.name,
  description: template.description
})); 