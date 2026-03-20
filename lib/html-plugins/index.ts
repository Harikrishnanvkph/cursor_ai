import { generateCustomLabelPluginCode } from "./custom-label-plugin-code";
import { generateUniversalImagePluginCode } from "./image-plugin-code";
import { generateOverlayPluginCode } from "./overlay-plugin-code";
import { generateSubtitlePluginCode } from "./subtitle-plugin-code";
import { generate3DPiePluginCode } from "./3d-pie-plugin-code";
import { generate3DBarPluginCode } from "./3d-bar-plugin-code";


// Re-export individual generators for direct use
export {
    generateCustomLabelPluginCode,
    generateUniversalImagePluginCode,
    generateOverlayPluginCode,
    generateSubtitlePluginCode,
    generate3DPiePluginCode,
    generate3DBarPluginCode,

};

/**
 * Generate the complete plugin system for HTML export
 */
export function generateCompletePluginSystem(chartConfig: any): string {
    const customLabelsConfig = (chartConfig.plugins as any)?.customLabels;
    const overlayConfig = (chartConfig.plugins as any)?.overlayPlugin;
    const subtitleConfig = (chartConfig.plugins as any)?.subtitle;
    const titleConfig = (chartConfig.plugins as any)?.title;
    const hasCustomLabels = customLabelsConfig && customLabelsConfig.labels;
    const hasImages = chartConfig.data?.datasets?.some((ds: any) => Array.isArray(ds.pointImages) && ds.pointImages.some((v: any) => !!v));
    const hasOverlays = overlayConfig && (overlayConfig.overlayImages?.length > 0 || overlayConfig.overlayTexts?.length > 0 || overlayConfig.overlayShapes?.length > 0);
    const hasSubtitle = subtitleConfig && subtitleConfig.display && subtitleConfig.text;
    const has3DPie = (chartConfig.plugins as any)?.pie3d?.enabled;
    const has3DBar = (chartConfig.plugins as any)?.bar3d?.enabled;

    let pluginCode = '';

    // Add custom label plugin if needed
    if (hasCustomLabels) {
        pluginCode += generateCustomLabelPluginCode(customLabelsConfig);
    }

    // Add universal image plugin if needed
    if (hasImages) {
        pluginCode += generateUniversalImagePluginCode();
    }

    // Add overlay plugin if needed
    if (hasOverlays) {
        pluginCode += generateOverlayPluginCode(overlayConfig);
    }

    // Add 3D Pie plugin if needed
    if (has3DPie) {
        pluginCode += generate3DPiePluginCode();
    }

    // Add 3D Bar plugin if needed
    if (has3DBar) {
        pluginCode += generate3DBarPluginCode();
    }

    // Note: SubTitle plugin is built into Chart.js (chart.umd.js includes it)
    // No need to generate custom subtitle plugin code

    return pluginCode;
}
