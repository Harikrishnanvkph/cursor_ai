import type { TemplateLayout } from "./template-store"

/**
 * Extracts template structure metadata for API requests
 * This includes dimensions, sections, and their types for AI generation
 */
export interface TemplateStructureMetadata {
  width: number
  height: number
  sections: {
    type: 'title' | 'heading' | 'custom' | 'main' | 'chart'
    name: string
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }[]
  chartArea: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Converts a TemplateLayout to a simplified structure for API requests
 */
export function extractTemplateStructure(template: TemplateLayout): TemplateStructureMetadata {
  return {
    width: template.width,
    height: template.height,
    sections: [
      // Chart area is always first
      {
        type: 'chart' as const,
        name: 'Chart Area',
        position: template.chartArea
      },
      // Then all text areas
      ...template.textAreas.map(area => ({
        type: area.type,
        name: `${area.type.charAt(0).toUpperCase() + area.type.slice(1)} Area`,
        position: area.position
      }))
    ],
    chartArea: template.chartArea
  }
}

/**
 * Formats template structure for AI prompt context
 */
export function formatTemplateStructureForPrompt(structure: TemplateStructureMetadata): string {
  const sectionsList = structure.sections
    .filter(s => s.type !== 'chart')
    .map(s => `- ${s.name} (${s.type})`)
    .join('\n')
  
  return `Template Structure:
- Dimensions: ${structure.width}px × ${structure.height}px
- Chart Area: ${structure.chartArea.width}px × ${structure.chartArea.height}px
- Text Sections:
${sectionsList}`
}

