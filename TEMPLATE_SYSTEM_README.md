# Chart Template System

## Overview

The Chart Template System allows users to create professional chart layouts with text areas, titles, headings, and detailed explanations. Templates provide a structured way to combine charts with contextual information for reports, presentations, and documentation.

## Features

### 🎨 **Template Layouts**
- **Standard Report**: Chart with title, heading, and main explanation area
- **Side-by-Side Layout**: Chart on left, text information on right
- **Compact Layout**: Chart with title, heading, custom text, and main explanation
- **Full Width Chart**: Chart spanning full width with text areas above and below

### 📏 **Standard Dimensions**
- **Template Size**: 1440px × 1024px (configurable)
- **High Resolution**: 2x scale for crisp exports
- **Responsive Scaling**: Automatic scaling to fit preview area

### ✏️ **Text Areas**
- **Title**: Main chart title with large, bold styling
- **Heading**: Subtitle or description text
- **Custom**: Additional information or context areas
- **Main**: Detailed explanations and analysis

### 🎛️ **Text Styling Options**
- **Font Family**: Arial, Times New Roman, Georgia, Verdana, Helvetica, Courier New
- **Font Size**: 12px to 48px range
- **Font Weight**: Normal, Bold, Thin, Light, Medium, Black
- **Text Alignment**: Left, Center, Right, Justify
- **Line Height**: 1.0 to 2.0 range
- **Letter Spacing**: 0 to 5px range
- **Text Color**: Color picker with hex input
- **Visibility Toggle**: Show/hide text areas

### 🔍 **View Controls**
- **Zoom**: 10% to 300% zoom levels
- **Pan**: Click and drag to navigate large templates
- **Reset**: Return to default view
- **Real-time Preview**: See changes instantly

### 📤 **Export Options**
- **PNG (High Res)**: 2x scale for crisp images
- **JPEG (High Res)**: Compressed format with quality control
- **HTML**: Standalone HTML with embedded Chart.js

## Implementation Details

### File Structure
```
lib/
├── template-store.ts          # Zustand store for template state
├── template-export.ts         # Export utilities for high-res output
components/
├── panels/
│   └── templates-panel.tsx    # Template management UI
├── template-chart-preview.tsx # Template-aware chart preview
└── sidebar.tsx               # Updated with Templates tab
```

### State Management
```typescript
interface TemplateLayout {
  id: string
  name: string
  description: string
  width: number
  height: number
  chartArea: { x, y, width, height }
  textAreas: TemplateTextArea[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
  padding: number
}

interface TemplateTextArea {
  id: string
  type: 'title' | 'heading' | 'custom' | 'main'
  content: string
  position: { x, y, width, height }
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: string
    color: string
    textAlign: 'left' | 'center' | 'right' | 'justify'
    lineHeight: number
    letterSpacing: number
  }
  visible: boolean
}
```

### Key Components

#### Templates Panel (`components/panels/templates-panel.tsx`)
- Template selection and management
- Text area editor with style controls
- Add/remove text areas
- Visibility toggles

#### Template Chart Preview (`components/template-chart-preview.tsx`)
- Renders chart with template layout
- Zoom and pan functionality
- Text area interaction
- Export controls

#### Template Export (`lib/template-export.ts`)
- High-resolution image export
- HTML export with embedded Chart.js
- Canvas-based rendering for crisp output

## Usage

### 1. Select a Template
1. Navigate to the **Templates** tab in the left sidebar
2. Choose from available templates (Standard Report, Side-by-Side, etc.)
3. Template will be applied to the chart preview

### 2. Edit Text Areas
1. Click on any text area in the template
2. Use the text editor in the right sidebar to modify:
   - Content
   - Font properties (size, family, weight)
   - Text alignment
   - Colors and spacing
   - Visibility

### 3. Customize Layout
1. Add new text areas with the "Add Text Area" button
2. Delete unwanted text areas
3. Toggle visibility of text areas
4. Adjust chart positioning within the template

### 4. Export
1. Use the export dropdown in the template preview
2. Choose format: PNG, JPEG, or HTML
3. Files are automatically named with template name and date

## Technical Features

### High-Resolution Export
- 2x scale rendering for crisp output
- Canvas-based text rendering with proper word wrapping
- Maintains original template dimensions (1440×1024px)

### Responsive Design
- Automatic scaling to fit preview area
- Maintains aspect ratio
- Zoom controls for detailed editing

### Performance Optimizations
- Efficient canvas rendering
- Debounced text updates
- Optimized re-renders

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast text options

## Future Enhancements

### Planned Features
- [ ] Custom template creation
- [ ] Template sharing and import/export
- [ ] More text area types (footnotes, captions)
- [ ] Advanced styling (shadows, borders, backgrounds)
- [ ] Template categories and tags
- [ ] Collaborative editing

### Technical Improvements
- [ ] Vector export (SVG)
- [ ] Print-optimized layouts
- [ ] Template versioning
- [ ] Cloud storage integration

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies
- React 19
- Zustand (state management)
- Chart.js (chart rendering)
- Lucide React (icons)
- Tailwind CSS (styling)

## Development

### Running the Application
```bash
npm run dev
```

### Testing Templates
1. Open the application
2. Navigate to the Templates tab
3. Select different templates
4. Test text editing and export functionality

### Adding New Templates
1. Add template definition to `lib/template-store.ts`
2. Include text areas with proper positioning
3. Test with various chart types

## Troubleshooting

### Common Issues
1. **Text not rendering**: Check font family availability
2. **Export fails**: Ensure chart data is present
3. **Zoom not working**: Check browser compatibility
4. **Template not loading**: Clear browser cache

### Performance Tips
1. Use fewer text areas for better performance
2. Avoid very large font sizes
3. Limit text content length
4. Use appropriate image formats for exports

## Contributing

When adding new features:
1. Follow the existing code structure
2. Add proper TypeScript types
3. Include accessibility considerations
4. Test with various chart types
5. Update documentation

---

**Note**: This template system is designed to work seamlessly with the existing chart builder while providing professional layout capabilities for reports and presentations. 