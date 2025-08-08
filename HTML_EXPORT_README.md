# AIChartor HTML Export System

## Overview

The AIChartor HTML Export System provides comprehensive functionality to export Chart.js charts as complete, standalone HTML files. This system allows users to create self-contained HTML documents that can be opened in any web browser without requiring the original application.

## Features

### 🎨 Multiple Templates
- **Modern Responsive**: Clean, modern design with responsive layout
- **Dark Theme**: Sleek dark theme with neon accents
- **Minimal**: Simple, clean template with minimal styling
- **Professional**: Business-ready template with corporate styling

### 📱 Responsive Design
- Automatically adapts to different screen sizes
- Mobile-friendly layouts
- Flexible chart dimensions
- Cross-browser compatibility

### ⚙️ Customization Options
- Custom titles and file names
- Adjustable chart dimensions
- Background color customization
- Toggle animations, tooltips, and legends
- Custom CSS and JavaScript injection

### 🔧 Advanced Features
- Export validation and error handling
- Multiple export formats (HTML, PNG, SVG, JSON)
- Batch export capabilities
- Self-contained HTML files
- Embedded chart data
- **Custom Labels & Images**: Full support for custom labels and universal image plugin
- **Plugin System**: Complete integration of customLabelPlugin and universalImagePlugin

## File Structure

```
cursor copy/lib/
├── html-exporter.ts          # Main HTML export functionality
├── html-templates.ts         # HTML template definitions
├── html-export-utils.ts      # Utility functions for export
└── html-plugins.ts           # Plugin system for custom labels and images

cursor copy/components/panels/
└── export-panel.tsx          # Export panel UI component

cursor copy/components/
└── chart-preview.tsx         # Chart preview with export buttons

cursor copy/public/
└── demo-export.html          # Demo HTML export file
```

## Usage

### Basic HTML Export

```typescript
import { downloadChartAsHTML } from "@/lib/html-exporter";

// Basic export with default settings
const result = downloadChartAsHTML({
  title: "My Chart",
  width: 800,
  height: 600,
  fileName: "my-chart.html"
});

if (result.success) {
  console.log(result.message);
} else {
  console.error(result.error);
}
```

### Advanced HTML Export with Custom Options

```typescript
import { downloadChartAsHTML } from "@/lib/html-exporter";

const result = downloadChartAsHTML({
  title: "Quarterly Sales Report",
  width: 1000,
  height: 700,
  backgroundColor: "#f8f9fa",
  includeResponsive: true,
  includeAnimations: true,
  includeTooltips: true,
  includeLegend: true,
  template: "professional",
  fileName: "quarterly-sales-report.html",
  customCSS: `
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
    }
  `,
  customJS: `
    // Add custom interactivity
    chart.canvas.addEventListener('click', function(event) {
      console.log('Chart clicked!');
    });
  `
});
```

### Generate HTML Content (Without Download)

```typescript
import { generateChartHTML } from "@/lib/html-exporter";

const { content, fileName, size } = generateChartHTML({
  title: "My Chart",
  template: "modern",
  width: 800,
  height: 600
});

console.log(`Generated HTML file: ${fileName} (${size} bytes)`);
```

## Plugin System

The HTML export system includes a comprehensive plugin system that ensures all custom features from the original application are preserved in the exported HTML files.

### Custom Labels Plugin

The exported HTML files include the complete `customLabelPlugin` functionality:

- **Label Positioning**: Supports all anchor positions (center, top, bottom, callout)
- **Visual Styling**: Custom colors, backgrounds, borders, and shapes
- **Interactive Features**: Draggable callouts with arrow lines and heads
- **Chart Type Support**: Optimized positioning for all chart types (bar, pie, line, etc.)
- **Responsive Design**: Labels adapt to chart resizing

```typescript
// Custom labels are automatically included in HTML exports
const chartConfig = {
  plugins: {
    customLabels: {
      labels: [
        [
          {
            text: "High Growth",
            anchor: "top",
            color: "#ff6b6b",
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            borderColor: "#ff6b6b",
            borderWidth: 2,
            borderRadius: 8,
            padding: 8
          }
        ]
      ]
    }
  }
};
```

### Universal Image Plugin

The exported HTML files include the complete `universalImagePlugin` functionality:

- **Image Positioning**: Center, callout, and fill modes for all chart types
- **Interactive Callouts**: Draggable image callouts with arrows
- **Chart Type Support**: Optimized rendering for bar, pie, line, scatter, and radar charts
- **Image Styling**: Custom borders, sizes, and shapes (circle, square, rounded)
- **Fill Modes**: Fill entire bars or slices with images

```typescript
// Image configurations are automatically included in HTML exports
const chartData = {
  datasets: [
    {
      data: [10, 20, 30],
      pointImages: ["image1.jpg", "image2.jpg", "image3.jpg"],
      pointImageConfig: [
        {
          type: "circle",
          size: 30,
          position: "callout",
          arrow: true,
          arrowColor: "#333"
        }
      ]
    }
  ]
};
```

### Plugin Integration

The plugin system automatically:

1. **Detects Features**: Analyzes chart configuration for custom labels and images
2. **Generates Code**: Creates complete plugin JavaScript code for HTML export
3. **Maintains Functionality**: Preserves all interactive features and styling
4. **Ensures Compatibility**: Works across all templates and export options

### Plugin Features

- **Automatic Detection**: No manual configuration required
- **Complete Functionality**: All features from the original plugins
- **Cross-Template Support**: Works with all HTML templates
- **Interactive Elements**: Draggable callouts and click events
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Graceful fallbacks for missing data

## Templates
- Clean, modern design with gradient backgrounds
- Responsive grid layout
- Smooth animations and transitions
- Professional typography
- Interactive elements

### Dark Theme Template
- Dark color scheme with neon accents
- Glowing effects and animations
- High contrast for better readability
- Modern glassmorphism design

### Minimal Template
- Simple, clean design
- Minimal styling and effects
- Fast loading and lightweight
- Perfect for simple reports

### Professional Template
- Business-ready design
- Corporate color scheme
- Structured layout with sections
- Professional typography and spacing

## Export Options

### HTMLExportOptions Interface

```typescript
interface HTMLExportOptions {
  title?: string;                    // Chart title
  width?: number;                    // Chart width in pixels
  height?: number;                   // Chart height in pixels
  backgroundColor?: string;          // Background color
  includeResponsive?: boolean;       // Enable responsive design
  includeAnimations?: boolean;       // Enable chart animations
  includeTooltips?: boolean;         // Enable tooltips
  includeLegend?: boolean;           // Show legend
  customCSS?: string;                // Custom CSS to inject
  customJS?: string;                 // Custom JavaScript to inject
  fileName?: string;                 // Output file name
  template?: string;                 // Template to use
}
```

## Utility Functions

### Validation

```typescript
import { validateHTMLOptions } from "@/lib/html-export-utils";

const validation = validateHTMLOptions({
  width: 800,
  height: 600,
  title: "My Chart"
});

if (validation.valid) {
  console.log("Options are valid");
} else {
  console.error("Validation errors:", validation.errors);
}
```

### Custom CSS Injection

```typescript
import { injectCustomCSS } from "@/lib/html-export-utils";

const htmlContent = generateChartHTML(options);
const enhancedHTML = injectCustomCSS(htmlContent, `
  .custom-style {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
  }
`);
```

### Custom JavaScript Injection

```typescript
import { injectCustomJS } from "@/lib/html-export-utils";

const htmlContent = generateChartHTML(options);
const enhancedHTML = injectCustomJS(htmlContent, `
  // Add custom functionality
  window.addEventListener('load', function() {
    console.log('Chart loaded successfully!');
  });
`);
```

## UI Integration

### Export Panel

The export panel provides a user-friendly interface for HTML export:

- Template selection dropdown
- Customization options (dimensions, colors, features)
- Preview functionality
- Copy to clipboard option
- Download button

### Chart Preview Integration

The main chart preview component includes an HTML export button:

```typescript
const handleExportHTML = () => {
  const result = downloadChartAsHTML({
    title: chartConfig.plugins?.title?.text || "Chart Export",
    width: chartWidth || 800,
    height: chartHeight || 600,
    backgroundColor: getBackgroundConfig().color || "#ffffff",
    template: "modern"
  });
};
```

## Advanced Features

### Self-Contained HTML

```typescript
import { createSelfContainedHTML } from "@/lib/html-export-utils";

const htmlContent = createSelfContainedHTML({
  title: "My Chart",
  width: 800,
  height: 600
});
```

### Responsive HTML

```typescript
import { createResponsiveHTML } from "@/lib/html-export-utils";

const htmlContent = createResponsiveHTML({
  title: "Responsive Chart",
  width: 800,
  height: 600
});
```

### HTML with Embedded Data

```typescript
import { generateHTMLWithEmbeddedData } from "@/lib/html-export-utils";

const htmlContent = generateHTMLWithEmbeddedData({
  title: "Chart with Data",
  width: 800,
  height: 600
});
```

## Error Handling

The export system includes comprehensive error handling:

```typescript
const result = downloadChartAsHTML(options);

if (result.success) {
  console.log(`Export successful: ${result.message}`);
  console.log(`File: ${result.fileName}, Size: ${result.size} bytes`);
} else {
  console.error(`Export failed: ${result.error}`);
}
```

## Browser Compatibility

The generated HTML files are compatible with:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Generated HTML files are optimized for fast loading
- Chart.js is loaded from CDN for smaller file sizes
- Responsive design reduces bandwidth usage
- Minimal templates for lightweight exports

## Security Features

- HTML content sanitization
- Safe script injection
- XSS protection
- Content validation

## Examples

### Example 1: Simple Bar Chart Export

```typescript
const result = downloadChartAsHTML({
  title: "Sales Performance",
  template: "modern",
  width: 800,
  height: 600
});
```

### Example 2: Professional Report Export

```typescript
const result = downloadChartAsHTML({
  title: "Q4 Financial Report",
  template: "professional",
  width: 1200,
  height: 800,
  includeAnimations: false,
  customCSS: `
    .report-header {
      background: #2c3e50;
      color: white;
      padding: 30px;
      text-align: center;
    }
  `
});
```

### Example 3: Dark Theme Export

```typescript
const result = downloadChartAsHTML({
  title: "Analytics Dashboard",
  template: "dark",
  width: 1000,
  height: 700,
  includeAnimations: true,
  includeTooltips: true
});
```

## Troubleshooting

### Common Issues

1. **Chart not displaying**: Check if Chart.js CDN is accessible
2. **Styling issues**: Verify custom CSS syntax
3. **Large file sizes**: Use minimal template for smaller files
4. **Responsive issues**: Test on different screen sizes

### Debug Mode

Enable debug logging:

```typescript
const result = downloadChartAsHTML({
  ...options,
  customJS: `
    console.log('Chart data:', chartData);
    console.log('Chart config:', chartConfig);
  `
});
```

## Future Enhancements

- [ ] Offline Chart.js embedding
- [ ] More template options
- [ ] Interactive customization interface
- [ ] Batch export functionality
- [ ] Export to PDF conversion
- [ ] Real-time preview updates

## Contributing

To add new templates or enhance the export system:

1. Create a new template in `html-templates.ts`
2. Add template to the `htmlTemplates` object
3. Update the `templateList` array
4. Test with different chart types and configurations
5. Update documentation

## License

This HTML export system is part of the AIChartor project and follows the same licensing terms. 