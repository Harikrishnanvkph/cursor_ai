/**
 * Generate the 3D Bar plugin code for HTML export
 */
export function generate3DBarPluginCode(): string {
    return `
// 3D Bar Plugin for HTML Export
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

    const bar3dPlugin = {
        id: 'bar3d',
        defaults: {
            enabled: false,
            depth: 12,
            darken: 0.2,
            angle: 45
        },

        beforeDatasetsDraw(chart, args, pluginOptions) {
            if (!pluginOptions || !pluginOptions.enabled) return;

            const ctx = chart.ctx;
            const depth = typeof pluginOptions.depth === 'number' ? pluginOptions.depth : 12;
            const darkenPercent = typeof pluginOptions.darken === 'number' ? pluginOptions.darken : 0.2;
            const angleRad = (typeof pluginOptions.angle === 'number' ? pluginOptions.angle : 45) * Math.PI / 180;

            const dx = Math.cos(angleRad) * depth;
            const dy = -Math.sin(angleRad) * depth;

            const shadowColor = pluginOptions.shadowColor || 'rgba(0,0,0,0.3)';
            const shadowBlur = typeof pluginOptions.shadowBlur === 'number' ? pluginOptions.shadowBlur : 10;
            const shadowOffsetX = typeof pluginOptions.shadowOffsetX === 'number' ? pluginOptions.shadowOffsetX : 0;
            const shadowOffsetY = typeof pluginOptions.shadowOffsetY === 'number' ? pluginOptions.shadowOffsetY : 5;

            const isHorizontalChart = chart.options.indexAxis === 'y';

            // --- Phase 1: Draw drop shadows ---
            if (shadowBlur > 0 || shadowOffsetY > 0) {
                ctx.save();
                const BIG_OFFSET = 10000;
                ctx.translate(BIG_OFFSET, 0);

                ctx.shadowColor = shadowColor;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowOffsetX = -BIG_OFFSET;
                ctx.shadowOffsetY = 0;
                ctx.fillStyle = 'rgba(0,0,0,1)';

                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (meta.hidden || meta.type !== 'bar') return;

                    meta.data.forEach((element) => {
                        const props = element.getProps(['x', 'y', 'base', 'width', 'height', 'horizontal'], true);
                        const { x, y, base, width, height } = props;
                        const horizontal = props.horizontal !== undefined ? props.horizontal : isHorizontalChart;
                        
                        if (x === undefined || y === undefined) return;

                        ctx.save();
                        ctx.translate(dx + shadowOffsetX, dy + shadowOffsetY);

                        if (!horizontal) {
                            ctx.fillRect(x - width / 2, y, width, base - y);
                        } else {
                            ctx.fillRect(base, y - height / 2, x - base, height);
                        }
                        ctx.restore();
                    });
                });
                ctx.restore();
            }

            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta.hidden || meta.type !== 'bar') return;

                meta.data.forEach((element) => {
                    const props = element.getProps(['x', 'y', 'base', 'width', 'height', 'horizontal'], true);
                    const { x, y, base, width, height } = props;
                    const horizontal = props.horizontal !== undefined ? props.horizontal : isHorizontalChart;
                    
                    if (x === undefined || y === undefined) return;

                    const color = element.options.backgroundColor;
                    const sideColor = darkenColor(color, darkenPercent);
                    const topColor = darkenColor(color, darkenPercent * 0.5);

                    ctx.save();
                    ctx.fillStyle = sideColor;

                    if (!horizontal) {
                        // Vertical Bar
                        const left = x - width / 2;
                        const right = x + width / 2;
                        const top = y;
                        const bottom = base;

                        const sideX = dx >= 0 ? right : left;
                        ctx.beginPath();
                        ctx.moveTo(sideX, top);
                        ctx.lineTo(sideX + dx, top + dy);
                        ctx.lineTo(sideX + dx, bottom + dy);
                        ctx.lineTo(sideX, bottom);
                        ctx.closePath();
                        ctx.fill();

                        const topY = dy <= 0 ? top : bottom;
                        ctx.fillStyle = topColor;
                        ctx.beginPath();
                        ctx.moveTo(left, topY);
                        ctx.lineTo(left + dx, topY + dy);
                        ctx.lineTo(right + dx, topY + dy);
                        ctx.lineTo(right, topY);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        // Horizontal Bar
                        const left = base;
                        const right = x;
                        const top = y - height / 2;
                        const bottom = y + height / 2;

                        const edgeY = dy <= 0 ? top : bottom;
                        ctx.beginPath();
                        ctx.moveTo(left, edgeY);
                        ctx.lineTo(left + dx, edgeY + dy);
                        ctx.lineTo(right + dx, edgeY + dy);
                        ctx.lineTo(right, edgeY);
                        ctx.closePath();
                        ctx.fill();

                        const endX = dx >= 0 ? right : left;
                        ctx.fillStyle = topColor;
                        ctx.beginPath();
                        ctx.moveTo(endX, top);
                        ctx.lineTo(endX + dx, top + dy);
                        ctx.lineTo(endX + dx, bottom + dy);
                        ctx.lineTo(endX, bottom);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                });
            });
        }
    };

    Chart.register(bar3dPlugin);
})();
`;
}
