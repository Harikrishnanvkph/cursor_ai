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
