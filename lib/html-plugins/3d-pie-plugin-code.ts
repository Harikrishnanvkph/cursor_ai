/**
 * Generate the 3D Pie plugin code for HTML export
 */
export function generate3DPiePluginCode(): string {
    return `
// 3D Pie Plugin for HTML Export
(function() {
    // Reusable canvas and cache for color processing
    let helperCanvas = null;
    let helperCtx = null;
    const colorCache = {};

    function darkenColor(colorStr, percent) {
        if (typeof colorStr !== 'string') return colorStr;
        
        const cacheKey = colorStr + '_' + percent;
        if (colorCache[cacheKey]) return colorCache[cacheKey];

        try {
            if (!helperCanvas) {
                helperCanvas = document.createElement('canvas');
                helperCanvas.width = 1;
                helperCanvas.height = 1;
                helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
            }
            if (!helperCtx) return colorStr;
            
            helperCtx.clearRect(0, 0, 1, 1);
            helperCtx.fillStyle = colorStr;
            helperCtx.fillRect(0, 0, 1, 1);
            const data = helperCtx.getImageData(0, 0, 1, 1).data;
            const r = Math.max(0, Math.floor(data[0] * (1 - percent)));
            const g = Math.max(0, Math.floor(data[1] * (1 - percent)));
            const b = Math.max(0, Math.floor(data[2] * (1 - percent)));
            const a = data[3] / 255;
            const result = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
            
            colorCache[cacheKey] = result;
            return result;
        } catch (e) {
            return colorStr;
        }
    }

    const pie3dPlugin = {
        id: 'pie3d',
        defaults: {
            enabled: false,
            depth: 20,
            darken: 0.25,
            tilt: 0.75,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 5
        },

        beforeDatasetsDraw(chart, args, pluginOptions) {
            if (!pluginOptions || !pluginOptions.enabled) return;

            const ctx = chart.ctx;
            const depth = typeof pluginOptions.depth === 'number' ? pluginOptions.depth : 20;
            const darkenPercent = typeof pluginOptions.darken === 'number' ? pluginOptions.darken : 0.25;
            const tilt = typeof pluginOptions.tilt === 'number' ? pluginOptions.tilt : 0.75;
            const shadowColor = pluginOptions.shadowColor || 'rgba(0,0,0,0.3)';
            const shadowBlur = typeof pluginOptions.shadowBlur === 'number' ? pluginOptions.shadowBlur : 10;
            const shadowOffsetX = typeof pluginOptions.shadowOffsetX === 'number' ? pluginOptions.shadowOffsetX : 0;
            const shadowOffsetY = typeof pluginOptions.shadowOffsetY === 'number' ? pluginOptions.shadowOffsetY : 5;

            const datasetsMeta = chart.data.datasets.map((_, i) => chart.getDatasetMeta(i));
            const hasArcs = datasetsMeta.some(meta => meta.type === 'pie' || meta.type === 'doughnut');
            if (!hasArcs) return;

            const chartArea = chart.chartArea;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;

            // --- Phase 1: Draw drop shadow ---
            if (shadowBlur > 0 || shadowOffsetY > 0) {
                ctx.save();
                
                // Off-screen translation trick for full-strength shadow
                const BIG_OFFSET = 10000;
                ctx.translate(BIG_OFFSET, 0);
                
                ctx.translate(centerX, centerY);
                ctx.scale(1, tilt);
                ctx.translate(-centerX, -centerY);
                ctx.translate(shadowOffsetX, depth + shadowOffsetY);
                
                ctx.shadowColor = shadowColor;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowOffsetX = -BIG_OFFSET;
                ctx.shadowOffsetY = 0;

                datasetsMeta.forEach(meta => {
                    if (!meta.hidden && (meta.type === 'pie' || meta.type === 'doughnut')) {
                        meta.data.forEach(element => {
                            const origBg = element.options.backgroundColor;
                            const origBorder = element.options.borderWidth;
                            // Ensure solid color for full shadow strength
                            element.options.backgroundColor = 'rgba(0,0,0,1)';
                            element.options.borderWidth = 0;
                            element.draw(ctx);
                            element.options.backgroundColor = origBg;
                            element.options.borderWidth = origBorder;
                        });
                    }
                });
                ctx.restore();
            }

            // --- Phase 2: Draw 3D extrusion walls ---
            const originalColors = [];
            const originalBorders = [];

            datasetsMeta.forEach((meta, datasetIndex) => {
                originalColors[datasetIndex] = [];
                originalBorders[datasetIndex] = [];
                meta.data.forEach((element, index) => {
                    originalColors[datasetIndex][index] = element.options.backgroundColor;
                    originalBorders[datasetIndex][index] = element.options.borderWidth;
                    element.options.backgroundColor = darkenColor(element.options.backgroundColor, darkenPercent);
                    element.options.borderWidth = 0;
                });
            });

            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.translate(centerX, centerY);
            ctx.scale(1, tilt);
            ctx.translate(-centerX, -centerY);

            for (let d = depth; d > 0; d--) {
                ctx.save();
                ctx.translate(0, d);
                datasetsMeta.forEach(meta => {
                    if (!meta.hidden && (meta.type === 'pie' || meta.type === 'doughnut')) {
                        meta.data.forEach(element => {
                            element.draw(ctx);
                        });
                    }
                });
                ctx.restore();
            }
            ctx.restore();

            // Restore original colors
            datasetsMeta.forEach((meta, datasetIndex) => {
                meta.data.forEach((element, index) => {
                    element.options.backgroundColor = originalColors[datasetIndex][index];
                    element.options.borderWidth = originalBorders[datasetIndex][index];
                });
            });

            // --- Phase 3: Persistent tilt for top face ---
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(1, tilt);
            ctx.translate(-centerX, -centerY);
            chart._pie3d_tiltApplied = true;
        },

        afterDatasetsDraw(chart, args, pluginOptions) {
            if (!pluginOptions || !pluginOptions.enabled) return;
            if (chart._pie3d_tiltApplied) {
                chart.ctx.restore();
                delete chart._pie3d_tiltApplied;
            }
        }
    };

    Chart.register(pie3dPlugin);
})();
`;
}
