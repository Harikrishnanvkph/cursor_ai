// Re-export all public symbols from the html-exporter module
export type { HTMLExportOptions } from "./export-types"
export { generateChartHTML, downloadChartAsHTML } from "./chart-html-generator"
export { generateCustomChartHTML, generateMinimalChartHTML, generateEmbeddedChartHTML } from "./chart-html-variants"
export { generateChartHTMLForTemplate } from "./template-html-generator"

// Re-export utilities that other modules may need
export { filterChartDataForExport, convertImageToBase64, processChartDataForExport, buildLegendConfigForExport, generateCustomLabelsFromConfig, syncImagePositionsToConfig } from "./export-utils"
