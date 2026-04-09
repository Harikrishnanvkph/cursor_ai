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

                    // Determine corner radius
                    const br = element.options.borderRadius;
                    let rVal = 0;
                    if (typeof br === 'number') {
                       rVal = br;
                    } else if (br && typeof br === 'object') {
                       rVal = Math.max(br.topLeft || 0, br.topRight || 0, br.bottomLeft || 0, br.bottomRight || 0) || 0;
                    }

                    ctx.save();
                    ctx.fillStyle = sideColor;

                    if (!horizontal) {
                      // Vertical Bar
                      const left = x - width / 2;
                      const right = x + width / 2;
                      const top = Math.min(y, base);
                      const bottom = Math.max(y, base);
                      const r = Math.min(Math.abs(right - left) / 2, Math.abs(bottom - top) / 2, rVal);
                      const isPositive = y <= base;
            
                      if (r <= 0.1) {
                        // Flat / Sharp Corners
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
                        // Rounded Corners
                        ctx.fillStyle = sideColor;
                        ctx.beginPath();
                        if (ctx.roundRect) {
                           const radii = isPositive ? [r, r, 0, 0] : [0, 0, r, r];
                           ctx.roundRect(left + dx, top + dy, right - left, bottom - top, radii);
                        } else {
                           ctx.rect(left + dx, top + dy, right - left, bottom - top);
                        }
                        ctx.fill();
            
                        // Side wall (Left or Right)
                        const sideX = dx >= 0 ? right : left;
                        ctx.beginPath();
                        // Start below curve if positive, above curve if negative
                        const startYOuter = isPositive ? top + r : top;
                        const endYOuter = isPositive ? bottom : bottom - r;
                        ctx.moveTo(sideX, startYOuter);
                        ctx.lineTo(sideX + dx, startYOuter + dy);
                        ctx.lineTo(sideX + dx, endYOuter + dy);
                        ctx.lineTo(sideX, endYOuter);
                        ctx.closePath();
                        ctx.fill();
            
                        // Top Face / End Extrusion
                        if (dy < 0 && isPositive) {
                            // Top is curved, perspective shows top
                            ctx.fillStyle = topColor;
                            
                            // Flat top bridging
                            ctx.beginPath();
                            ctx.moveTo(left + r, top);
                            ctx.lineTo(left + r + dx, top + dy);
                            ctx.lineTo(right - r + dx, top + dy);
                            ctx.lineTo(right - r, top);
                            ctx.closePath();
                            ctx.fill();
            
                            // Top-Left corner sweep
                            ctx.beginPath();
                            ctx.arc(left + r, top + r, r, Math.PI, 1.5 * Math.PI);
                            ctx.lineTo(left + r + dx, top + dy);
                            ctx.arc(left + r + dx, top + r + dy, r, 1.5 * Math.PI, Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
            
                            // Top-Right corner sweep
                            ctx.beginPath();
                            ctx.arc(right - r, top + r, r, 1.5 * Math.PI, 2 * Math.PI);
                            ctx.lineTo(right + dx, top + r + dy);
                            ctx.arc(right - r + dx, top + r + dy, r, 2 * Math.PI, 1.5 * Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
                        } else if (dy > 0 && !isPositive) {
                            // Bottom is curved, perspective shows bottom
                            ctx.fillStyle = topColor;
            
                            // Flat bottom bridging
                            ctx.beginPath();
                            ctx.moveTo(left + r, bottom);
                            ctx.lineTo(left + r + dx, bottom + dy);
                            ctx.lineTo(right - r + dx, bottom + dy);
                            ctx.lineTo(right - r, bottom);
                            ctx.closePath();
                            ctx.fill();
            
                            // Bottom-Left corner sweep
                            ctx.beginPath();
                            ctx.arc(left + r, bottom - r, r, 0.5 * Math.PI, Math.PI);
                            ctx.lineTo(left + dx, bottom - r + dy);
                            ctx.arc(left + r + dx, bottom - r + dy, r, Math.PI, 0.5 * Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
            
                            // Bottom-Right corner sweep
                            ctx.beginPath();
                            ctx.arc(right - r, bottom - r, r, 0, 0.5 * Math.PI);
                            ctx.lineTo(right - r + dx, bottom + dy);
                            ctx.arc(right - r + dx, bottom - r + dy, r, 0.5 * Math.PI, 0, true);
                            ctx.closePath();
                            ctx.fill();
                        } else {
                            // Curved end is hidden, draw the straight opposite edge normally
                            const topY = dy <= 0 ? top : bottom;
                            ctx.fillStyle = topColor;
                            ctx.beginPath();
                            ctx.moveTo(left, topY);
                            ctx.lineTo(left + dx, topY + dy);
                            ctx.lineTo(right + dx, topY + dy);
                            ctx.lineTo(right, topY);
                            ctx.closePath();
                            ctx.fill();
                        }
                      }
                    } else {
                      // Horizontal Bar
                      const left = Math.min(x, base);
                      const right = Math.max(x, base);
                      const top = y - height / 2;
                      const bottom = y + height / 2;
                      const r = Math.min(Math.abs(right - left) / 2, Math.abs(bottom - top) / 2, rVal);
                      const isPositive = x >= base;
            
                      if (r <= 0.1) {
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
                      } else {
                        // Rounded Corners
                        ctx.fillStyle = sideColor;
                        ctx.beginPath();
                        if (ctx.roundRect) {
                           const radii = isPositive ? [0, r, r, 0] : [r, 0, 0, r];
                           ctx.roundRect(left + dx, top + dy, right - left, bottom - top, radii);
                        } else {
                           ctx.rect(left + dx, top + dy, right - left, bottom - top);
                        }
                        ctx.fill();
            
                        // "Top" or "Bottom" flat edge (bridge)
                        const edgeY = dy <= 0 ? top : bottom;
                        ctx.beginPath();
                        const startXOuter = isPositive ? left : left + r;
                        const endXOuter = isPositive ? right - r : right;
                        ctx.moveTo(startXOuter, edgeY);
                        ctx.lineTo(startXOuter + dx, edgeY + dy);
                        ctx.lineTo(endXOuter + dx, edgeY + dy);
                        ctx.lineTo(endXOuter, edgeY);
                        ctx.closePath();
                        ctx.fill();
            
                        // End Face Extrusion (Right or Left)
                        if (dx > 0 && isPositive) {
                            // Right side is curved and perspective shows right
                            ctx.fillStyle = topColor;
                            
                            // Flat right bridging
                            ctx.beginPath();
                            ctx.moveTo(right, top + r);
                            ctx.lineTo(right + dx, top + r + dy);
                            ctx.lineTo(right + dx, bottom - r + dy);
                            ctx.lineTo(right, bottom - r);
                            ctx.closePath();
                            ctx.fill();
            
                            // Top-Right sweep
                            ctx.beginPath();
                            ctx.arc(right - r, top + r, r, 1.5 * Math.PI, 2 * Math.PI);
                            ctx.lineTo(right + dx, top + r + dy);
                            ctx.arc(right - r + dx, top + r + dy, r, 2 * Math.PI, 1.5 * Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
            
                            // Bottom-Right sweep
                            ctx.beginPath();
                            ctx.arc(right - r, bottom - r, r, 0, 0.5 * Math.PI);
                            ctx.lineTo(right - r + dx, bottom + dy);
                            ctx.arc(right - r + dx, bottom - r + dy, r, 0.5 * Math.PI, 0, true);
                            ctx.closePath();
                            ctx.fill();
                        } else if (dx < 0 && !isPositive) {
                            // Left side is curved and perspective shows left
                            ctx.fillStyle = topColor;
            
                            // Flat left bridging
                            ctx.beginPath();
                            ctx.moveTo(left, top + r);
                            ctx.lineTo(left + dx, top + r + dy);
                            ctx.lineTo(left + dx, bottom - r + dy);
                            ctx.lineTo(left, bottom - r);
                            ctx.closePath();
                            ctx.fill();
            
                            // Top-Left sweep
                            ctx.beginPath();
                            ctx.arc(left + r, top + r, r, Math.PI, 1.5 * Math.PI);
                            ctx.lineTo(left + r + dx, top + dy);
                            ctx.arc(left + r + dx, top + r + dy, r, 1.5 * Math.PI, Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
            
                            // Bottom-Left sweep
                            ctx.beginPath();
                            ctx.arc(left + r, bottom - r, r, 0.5 * Math.PI, Math.PI);
                            ctx.lineTo(left + dx, bottom - r + dy);
                            ctx.arc(left + r + dx, bottom - r + dy, r, Math.PI, 0.5 * Math.PI, true);
                            ctx.closePath();
                            ctx.fill();
                        } else {
                            // Curved end is hidden, draw straight opposite end normally
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
                      }
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
