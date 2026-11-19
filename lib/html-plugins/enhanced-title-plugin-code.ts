/**
 * Generate the enhanced title plugin code for HTML export
 */
export function generateEnhancedTitlePluginCode(): string {
    return `
// Enhanced Title Plugin for HTML Export
const enhancedTitlePlugin = {
    id: 'enhancedTitle',
    beforeDraw(chart) {
        const titleConfig = chart.config && chart.config.options && chart.config.options.plugins && chart.config.options.plugins.title;
        if (!titleConfig || !titleConfig.display) return;
        const hasEnhancedFeatures = titleConfig.shadow || titleConfig.stroke || (titleConfig.rotation !== false && titleConfig.rotation !== undefined);
        if (!hasEnhancedFeatures) return;

        titleConfig._originalDisplay = titleConfig.display;
        titleConfig.display = false;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const font = titleConfig.font || {};
        const fontUtils = typeof window !== 'undefined' ? window.__chartFontUtils : null;
        let rawText = titleConfig.text || '';
        if (fontUtils && fontUtils.applyTextTransformToContent) {
            rawText = fontUtils.applyTextTransformToContent(rawText, font.textTransform);
        }
        const text = Array.isArray(rawText) ? rawText.join(' ') : String(rawText);
        if (!text) return;

        const position = titleConfig.position || 'top';
        const align = titleConfig.align || 'center';
        const padding = typeof titleConfig.padding === 'number' ? titleConfig.padding : ((titleConfig.padding && titleConfig.padding.top) || 10);
        const fontSize = font.size || 16;
        const fontFamily = font.family || 'Arial';
        const fontWeight = font.weight || '700';
        const fontStyle = font.style || 'normal';
        const color = titleConfig.color || '#000000';

        let x = chartArea.left + (chartArea.right - chartArea.left) / 2;
        let y = position === 'top' ? padding + fontSize / 2 : chart.height - padding - fontSize / 2;
        if (align === 'start') x = chartArea.left + padding;
        else if (align === 'end') x = chartArea.right - padding;

        ctx.save();
        ctx.font = fontUtils && fontUtils.buildCanvasFont
            ? fontUtils.buildCanvasFont({ style: fontStyle, weight: fontWeight, size: fontSize, family: fontFamily })
            : (fontWeight + ' ' + fontSize + 'px ' + fontFamily);
        ctx.textAlign = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
        ctx.textBaseline = 'middle';

        if (titleConfig.rotation !== false && titleConfig.rotation !== undefined) {
            ctx.translate(x, y);
            ctx.rotate((titleConfig.rotation * Math.PI) / 180);
            x = 0;
            y = 0;
        }
        if (titleConfig.shadow) {
            const shadow = titleConfig.shadow;
            ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = shadow.blur || 4;
            ctx.shadowOffsetX = shadow.offsetX || 2;
            ctx.shadowOffsetY = shadow.offsetY || 2;
        }
        const runDraw = () => {
            if (titleConfig.stroke) {
                const stroke = titleConfig.stroke;
                ctx.strokeStyle = stroke.color || '#000000';
                ctx.lineWidth = stroke.width || 1;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(text, x, y);
            }
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
            if ((font.underline || font.strikethrough) && fontUtils && fontUtils.drawCanvasTextDecoration) {
                fontUtils.drawCanvasTextDecoration(ctx, text, x, y, {
                    underline: !!font.underline,
                    strikethrough: !!font.strikethrough,
                    color: color,
                    fontSize: fontSize
                });
            }
        };
        if (fontUtils && fontUtils.withCanvasLetterSpacing) {
            fontUtils.withCanvasLetterSpacing(ctx, font.letterSpacing, runDraw);
        } else {
            runDraw();
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();
    },
    afterDraw(chart) {
        const titleConfig = chart.config && chart.config.options && chart.config.options.plugins && chart.config.options.plugins.title;
        if (titleConfig && titleConfig._originalDisplay !== undefined) {
            titleConfig.display = titleConfig._originalDisplay;
            delete titleConfig._originalDisplay;
        }
    }
};
Chart.register(enhancedTitlePlugin);
`;
}
